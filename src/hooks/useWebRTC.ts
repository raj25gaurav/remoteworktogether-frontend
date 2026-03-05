import { useEffect, useRef, useCallback, useState } from 'react'
import { STUN_SERVERS, API_URL } from '../utils/constants'
import { WS_MESSAGE_TYPE } from '../types/enums'

// Cached ICE server config — fetched once from backend, valid for 1 hour
let cachedIceServers: RTCIceServer[] | null = null

async function fetchIceServers(): Promise<RTCIceServer[]> {
    if (cachedIceServers) return cachedIceServers
    try {
        const res = await fetch(`${API_URL}/api/turn-credentials`)
        if (!res.ok) throw new Error('Failed to fetch TURN credentials')
        const data = await res.json()
        cachedIceServers = data.iceServers
        // Clear cache after TTL so we refresh credentials
        setTimeout(() => { cachedIceServers = null }, (data.ttl - 60) * 1000)
        console.log('[WebRTC] TURN credentials fetched from backend ✅')
        return cachedIceServers!
    } catch (e) {
        console.warn('[WebRTC] Could not fetch TURN credentials, using fallback STUN only:', e)
        return STUN_SERVERS.iceServers as RTCIceServer[]
    }
}

export function useWebRTC(
    userId: string | null,
    roomId: string,
    send: (type: string, payload: any) => void,
) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})

    // Always-current refs so closures never go stale
    const localStreamRef = useRef<MediaStream | null>(null)
    const sendRef = useRef(send)
    const peersRef = useRef<Record<string, RTCPeerConnection>>({})
    // Buffer ICE candidates that arrive before remote description is set
    const iceCandidateBuffer = useRef<Record<string, RTCIceCandidateInit[]>>({})

    // Keep sendRef current on every render
    useEffect(() => { sendRef.current = send }, [send])

    // ── Get local camera/mic ──────────────────────────────────────────────────
    const getLocalStream = useCallback(async () => {
        // Don't re-acquire if already have stream
        if (localStreamRef.current) return localStreamRef.current
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            localStreamRef.current = stream
            setLocalStream(stream)
            return stream
        } catch {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                localStreamRef.current = stream
                setLocalStream(stream)
                return stream
            } catch {
                console.warn('[WebRTC] No media access available')
                return null
            }
        }
    }, [])

    // ── Create a peer connection for a given remote user ──────────────────────
    const createPeer = useCallback(async (targetId: string): Promise<RTCPeerConnection> => {
        // Close any existing connection first
        if (peersRef.current[targetId]) {
            peersRef.current[targetId].close()
            delete peersRef.current[targetId]
        }

        // Fetch fresh TURN credentials from backend (cached for 1hr)
        const iceServers = await fetchIceServers()
        const pc = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: 10 })
        peersRef.current[targetId] = pc
        iceCandidateBuffer.current[targetId] = []


        // Add all current local tracks
        const stream = localStreamRef.current
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
        }

        // Send ICE candidates as they arrive
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                sendRef.current(WS_MESSAGE_TYPE.WEBRTC_ICE, {
                    target_id: targetId,
                    candidate: e.candidate.toJSON(),
                })
            }
        }

        // Receive remote stream
        pc.ontrack = (e) => {
            if (e.streams && e.streams[0]) {
                const remoteStream = e.streams[0]
                setRemoteStreams(prev => ({ ...prev, [targetId]: remoteStream }))
            }
        }

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState
            if (state === 'failed') {
                pc.restartIce()
            }
            if (state === 'disconnected' || state === 'closed') {
                setRemoteStreams(prev => {
                    const next = { ...prev }
                    delete next[targetId]
                    return next
                })
                delete peersRef.current[targetId]
                delete iceCandidateBuffer.current[targetId]
            }
        }

        return pc
    }, [])

    // ── Drain buffered ICE candidates after remote description is set ─────────
    const drainIceCandidates = useCallback(async (targetId: string, pc: RTCPeerConnection) => {
        const buffered = iceCandidateBuffer.current[targetId] || []
        iceCandidateBuffer.current[targetId] = []
        for (const candidate of buffered) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (e) {
                console.warn('[WebRTC] Failed to add buffered ICE candidate', e)
            }
        }
    }, [])

    // ── Initiate a call to another user (caller side) ─────────────────────────
    const callUser = useCallback(async (targetId: string) => {
        if (!localStreamRef.current) {
            const stream = await getLocalStream()
            if (!stream) return
        }
        const pc = await createPeer(targetId)
        try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
            await pc.setLocalDescription(offer)
            sendRef.current(WS_MESSAGE_TYPE.WEBRTC_OFFER, {
                target_id: targetId,
                sdp: pc.localDescription,
            })
        } catch (e) {
            console.error('[WebRTC] Failed to create offer', e)
        }
    }, [createPeer, getLocalStream])

    // ── Listen for WebRTC signaling messages from WebSocket ───────────────────
    useEffect(() => {
        const handler = async (event: Event) => {
            const msg = (event as CustomEvent).detail
            const { type, payload, sender_id } = msg

            if (!sender_id) return

            if (type === WS_MESSAGE_TYPE.WEBRTC_OFFER) {
                // Ensure we have local media before answering
                if (!localStreamRef.current) await getLocalStream()

                const pc = await createPeer(sender_id)
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    await drainIceCandidates(sender_id, pc)
                    const answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)
                    sendRef.current(WS_MESSAGE_TYPE.WEBRTC_ANSWER, {
                        target_id: sender_id,
                        sdp: pc.localDescription,
                    })
                } catch (e) {
                    console.error('[WebRTC] Failed to handle offer', e)
                }

            } else if (type === WS_MESSAGE_TYPE.WEBRTC_ANSWER) {
                const pc = peersRef.current[sender_id]
                if (!pc) return
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    await drainIceCandidates(sender_id, pc)
                } catch (e) {
                    console.error('[WebRTC] Failed to handle answer', e)
                }

            } else if (type === WS_MESSAGE_TYPE.WEBRTC_ICE) {
                const pc = peersRef.current[sender_id]
                if (!payload.candidate) return
                if (!pc || !pc.remoteDescription) {
                    // Buffer until remote description is set
                    if (!iceCandidateBuffer.current[sender_id]) {
                        iceCandidateBuffer.current[sender_id] = []
                    }
                    iceCandidateBuffer.current[sender_id].push(payload.candidate)
                } else {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                    } catch (e) {
                        console.warn('[WebRTC] Failed to add ICE candidate', e)
                    }
                }
            }
        }

        window.addEventListener('webrtc-message', handler)
        return () => window.removeEventListener('webrtc-message', handler)
    }, [createPeer, drainIceCandidates, getLocalStream])

    // ── Auto-call all existing users when joining a room ─────────────────────
    // This effect runs when roomId changes and ensures the newcomer calls everyone
    const roomIdRef = useRef(roomId)
    useEffect(() => { roomIdRef.current = roomId }, [roomId])

    const stopLocalStream = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
        setLocalStream(null)
    }, [])

    const closeAllPeers = useCallback(() => {
        Object.values(peersRef.current).forEach(pc => pc.close())
        peersRef.current = {}
        iceCandidateBuffer.current = {}
        setRemoteStreams({})
    }, [])

    const toggleMute = useCallback((muted: boolean) => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted })
    }, [])

    const toggleCamera = useCallback((off: boolean) => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !off })
    }, [])

    return {
        localStream,
        remoteStreams,
        getLocalStream,
        callUser,
        stopLocalStream,
        closeAllPeers,
        toggleMute,
        toggleCamera,
    }
}
