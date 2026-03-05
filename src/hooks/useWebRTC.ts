import { useEffect, useRef, useCallback, useState } from 'react'
import { STUN_SERVERS } from '../utils/constants'
import { WS_MESSAGE_TYPE } from '../types/enums'

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
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null)
    const peers = useRef<Record<string, PeerConnection>>({})
    const localStreamRef = useRef<MediaStream | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)

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
                send(WS_MESSAGE_TYPE.WEBRTC_ICE, { target_id: targetId, candidate: event.candidate })
            }
        }

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams
            const track = event.track
            
            // Check if this is a screen share track (usually has 'screen' or 'display' in label)
            const isScreenShare = track.kind === 'video' && (
                track.label.toLowerCase().includes('screen') ||
                track.label.toLowerCase().includes('display') ||
                track.label.toLowerCase().includes('window')
            )
            
            if (isScreenShare) {
                // Store screen share stream separately
                const screenStream = new MediaStream([track])
                setRemoteStreams((prev) => ({ 
                    ...prev, 
                    [`${targetId}_screen`]: screenStream 
                }))
            } else {
                // Regular camera/audio stream
                setRemoteStreams((prev) => ({ ...prev, [targetId]: remoteStream }))
            }
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
        // Don't create duplicate connections
        if (peers.current[targetId]) {
            console.log(`Already connected to ${targetId}`)
            return
        }
        
        // Make sure we have a local stream before calling
        if (!localStreamRef.current) {
            console.warn('No local stream available, cannot call user')
            return
        }
        
        const pc = createPeerConnection(targetId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        send(WS_MESSAGE_TYPE.WEBRTC_OFFER, { target_id: targetId, sdp: offer })
    }, [createPeerConnection, send])

    // Listen for WebRTC signaling messages
    useEffect(() => {
        const handler = async (event: Event) => {
            const msg = (event as CustomEvent).detail
            const { type, payload, sender_id } = msg

            if (type === WS_MESSAGE_TYPE.WEBRTC_OFFER) {
                const pc = createPeerConnection(sender_id)
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                send(WS_MESSAGE_TYPE.WEBRTC_ANSWER, { target_id: sender_id, sdp: answer })
            } else if (type === WS_MESSAGE_TYPE.WEBRTC_ANSWER) {
                const peer = peers.current[sender_id]
                if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            } else if (type === WS_MESSAGE_TYPE.WEBRTC_ICE) {
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

    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop())
            screenStreamRef.current = null
            setScreenShareStream(null)
            setIsScreenSharing(false)
        }
    }, [])

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            stopScreenShare()
        } else {
            // Start screen sharing
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false, // Don't capture system audio, use mic audio
                })
                
                screenStreamRef.current = screenStream
                setScreenShareStream(screenStream)
                setIsScreenSharing(true)

                // Add screen share as a new video track to all peer connections
                // We'll create a separate sender for screen share
                const screenVideoTrack = screenStream.getVideoTracks()[0]
                if (screenVideoTrack) {
                    Object.values(peers.current).forEach(({ pc }) => {
                        // Add screen share track as additional track
                        pc.addTrack(screenVideoTrack, screenStream)
                    })
                }

                // Handle screen share stop (user clicks stop in browser UI)
                screenVideoTrack.onended = () => {
                    stopScreenShare()
                }
            } catch (error) {
                console.error('Failed to start screen sharing:', error)
            }
        }
    }, [isScreenSharing, stopScreenShare])

    const closeAllPeers = useCallback(() => {
        Object.values(peers.current).forEach(({ pc }) => pc.close())
        peers.current = {}
        setRemoteStreams({})
    }, [])

    // Cleanup screen stream on unmount
    useEffect(() => {
        return () => {
            screenStreamRef.current?.getTracks().forEach((track) => track.stop())
        }
    }, [])

    return {
        localStream,
        remoteStreams,
        isScreenSharing,
        screenShareStream,
        getLocalStream,
        callUser,
        stopLocalStream,
        closeAllPeers,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
    }
}
