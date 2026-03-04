import { useEffect, useRef, useCallback, useState } from 'react'
import { STUN_SERVERS } from '../utils/constants'

interface PeerConnection {
    pc: RTCPeerConnection
    stream?: MediaStream
}

export function useWebRTC(
    userId: string | null,
    roomId: string,
    send: (type: string, payload: any) => void,
) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
    const peers = useRef<Record<string, PeerConnection>>({})
    const localStreamRef = useRef<MediaStream | null>(null)

    const getLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            localStreamRef.current = stream
            setLocalStream(stream)
            return stream
        } catch (e) {
            console.warn('Media access denied, using audio only')
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                localStreamRef.current = stream
                setLocalStream(stream)
                return stream
            } catch (e2) {
                console.warn('No media access available')
                return null
            }
        }
    }, [])

    const createPeerConnection = useCallback((targetId: string) => {
        const pc = new RTCPeerConnection(STUN_SERVERS)

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                send('webrtc_ice', { target_id: targetId, candidate: event.candidate })
            }
        }

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams
            setRemoteStreams((prev) => ({ ...prev, [targetId]: remoteStream }))
        }

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setRemoteStreams((prev) => {
                    const updated = { ...prev }
                    delete updated[targetId]
                    return updated
                })
                delete peers.current[targetId]
            }
        }

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!)
            })
        }

        peers.current[targetId] = { pc }
        return pc
    }, [send])

    const callUser = useCallback(async (targetId: string) => {
        const pc = createPeerConnection(targetId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        send('webrtc_offer', { target_id: targetId, sdp: offer })
    }, [createPeerConnection, send])

    // Listen for WebRTC signaling messages
    useEffect(() => {
        const handler = async (event: Event) => {
            const msg = (event as CustomEvent).detail
            const { type, payload, sender_id } = msg

            if (type === 'webrtc_offer') {
                const pc = createPeerConnection(sender_id)
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                send('webrtc_answer', { target_id: sender_id, sdp: answer })
            } else if (type === 'webrtc_answer') {
                const peer = peers.current[sender_id]
                if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            } else if (type === 'webrtc_ice') {
                const peer = peers.current[sender_id]
                if (peer && payload.candidate) {
                    await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                }
            }
        }

        window.addEventListener('webrtc-message', handler)
        return () => window.removeEventListener('webrtc-message', handler)
    }, [createPeerConnection, send])

    const stopLocalStream = useCallback(() => {
        localStreamRef.current?.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
        localStreamRef.current = null
    }, [])

    const toggleMute = useCallback((muted: boolean) => {
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !muted))
    }, [])

    const toggleCamera = useCallback((off: boolean) => {
        localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !off))
    }, [])

    const closeAllPeers = useCallback(() => {
        Object.values(peers.current).forEach(({ pc }) => pc.close())
        peers.current = {}
        setRemoteStreams({})
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
