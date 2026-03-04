import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { WS_URL } from '../utils/constants'

export function useWebSocket(userId: string | null) {
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Use individual selectors to avoid infinite loop
    const setWsConnected = useStore((s) => s.setWsConnected)
    const setUsers = useStore((s) => s.setUsers)
    const setRooms = useStore((s) => s.setRooms)
    const upsertUser = useStore((s) => s.upsertUser)
    const removeUser = useStore((s) => s.removeUser)
    const addMessage = useStore((s) => s.addMessage)
    const addReaction = useStore((s) => s.addReaction)
    const setCurrentRoom = useStore((s) => s.setCurrentRoom)
    const upsertRoom = useStore((s) => s.upsertRoom)
    const setPendingInvite = useStore((s) => s.setPendingInvite)

    const handleMessage = useCallback((msg: any) => {
        const { type, payload } = msg

        switch (type) {
            case 'user_list':
                if (payload.users) setUsers(payload.users)
                if (payload.rooms) setRooms(payload.rooms)
                if (payload.moved_to) setCurrentRoom(payload.moved_to)
                break

            case 'user_join':
                if (payload.user) upsertUser(payload.user)
                break

            case 'user_leave':
                if (payload.user_id) removeUser(payload.user_id)
                break

            case 'chat_message':
                addMessage(payload)
                break

            case 'reaction':
                addReaction(payload)
                break

            case 'room_create':
                if (payload.room) upsertRoom(payload.room)
                break

            case 'room_update':
                if (payload.rooms) setRooms(payload.rooms)
                break

            case 'room_join':
                if (payload.user) upsertUser(payload.user)
                if (payload.room_id) {
                    const myId = useStore.getState().myUser?.id
                    if (payload.user?.id === myId) setCurrentRoom(payload.room_id)
                }
                break

            case 'room_leave':
                // Update room member state handled via user_list
                break

            case 'room_invite':
                setPendingInvite({ room: payload.room, from_user: payload.from_user, from_id: payload.from_id })
                break

            case 'status_update': {
                const user = useStore.getState().users[payload.user_id]
                if (user) upsertUser({ ...user, status: payload.status })
                break
            }

            case 'pong':
                // Heartbeat response, all good
                break

            case 'error':
                console.error('Server error:', payload.message)
                break

            default:
                // Pass WebRTC messages up via custom event
                window.dispatchEvent(new CustomEvent('webrtc-message', { detail: msg }))
        }
    }, [setUsers, setRooms, setCurrentRoom, upsertUser, removeUser, addMessage, addReaction, upsertRoom, setPendingInvite])

    const connect = useCallback(() => {
        if (!userId) return
        if (ws.current?.readyState === WebSocket.OPEN) return

        const socket = new WebSocket(`${WS_URL}/${userId}`)
        ws.current = socket

        socket.onopen = () => {
            console.log('✅ WebSocket connected')
            setWsConnected(true)
            // Heartbeat
            const ping = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping', payload: {} }))
                } else {
                    clearInterval(ping)
                }
            }, 25000)
        }

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                handleMessage(msg)
            } catch (e) {
                console.error('Failed to parse message', e)
            }
        }

        socket.onclose = () => {
            console.log('❌ WebSocket disconnected')
            setWsConnected(false)
            // Reconnect after 3s
            reconnectTimer.current = setTimeout(connect, 3000)
        }

        socket.onerror = (e) => {
            console.error('WebSocket error', e)
            socket.close()
        }
    }, [userId, handleMessage, setWsConnected])

    useEffect(() => {
        connect()
        return () => {
            if (reconnectTimer.current !== null) clearTimeout(reconnectTimer.current)
            ws.current?.close()
        }
    }, [connect])

    const send = useCallback((type: string, payload: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }))
        } else {
            console.warn('WebSocket not connected, cannot send:', type)
        }
    }, [])

    return { send, ws }
}
