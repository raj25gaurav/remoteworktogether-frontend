import { create } from 'zustand'

export interface User {
    id: string
    username: string
    avatar: string
    status: string
    room_id: string
    is_muted: boolean
    is_camera_off: boolean
    color: string
}

export interface Room {
    id: string
    name: string
    created_by: string
    members: string[]
    is_private: boolean
    max_members: number
    description: string
    emoji: string
}

export interface ChatMessage {
    id: string
    sender_id: string
    username: string
    content: string
    room_id: string
    timestamp: number
    message_type: string
    avatar?: string
    color?: string
}

export interface Reaction {
    id: string
    sender_id: string
    username: string
    type: string
    content: string
    room_id: string
    x: number
    y: number
    timestamp: number
    animation: string
    size: string
}

export interface InviteNotification {
    room: Room
    from_user: string
    from_id: string
}

interface AppState {
    // My session
    myUser: User | null
    setMyUser: (user: User | null) => void

    // All users & rooms
    users: Record<string, User>
    rooms: Record<string, Room>
    setUsers: (users: User[]) => void
    setRooms: (rooms: Room[]) => void
    upsertUser: (user: User) => void
    removeUser: (userId: string) => void
    upsertRoom: (room: Room) => void

    // Current room
    currentRoomId: string
    setCurrentRoom: (roomId: string) => void

    // Messages per room
    messages: Record<string, ChatMessage[]>
    addMessage: (msg: ChatMessage) => void

    // Active reactions
    reactions: Reaction[]
    addReaction: (reaction: Reaction) => void
    removeReaction: (id: string) => void

    // Invite
    pendingInvite: InviteNotification | null
    setPendingInvite: (inv: InviteNotification | null) => void

    // UI State
    showEmojiPanel: boolean
    showAIPanel: boolean
    showChat: boolean
    toggleEmojiPanel: () => void
    toggleAIPanel: () => void
    toggleChat: () => void

    // WebSocket connection status
    wsConnected: boolean
    setWsConnected: (connected: boolean) => void

    // Media
    isMuted: boolean
    isCameraOff: boolean
    toggleMute: () => void
    toggleCamera: () => void

    // Ambient sound
    ambientSound: string | null
    setAmbientSound: (sound: string | null) => void
}

export type { AppState }

export const useStore = create<AppState>((set, get) => ({
    myUser: null,
    setMyUser: (user) => set({ myUser: user }),

    users: {},
    rooms: {},
    setUsers: (users) => {
        const map: Record<string, User> = {}
        users.forEach((u) => (map[u.id] = u))
        set({ users: map })
    },
    setRooms: (rooms) => {
        const map: Record<string, Room> = {}
        rooms.forEach((r) => (map[r.id] = r))
        set({ rooms: map })
    },
    upsertUser: (user) =>
        set((s) => ({ users: { ...s.users, [user.id]: user } })),
    removeUser: (userId) =>
        set((s) => {
            const users = { ...s.users }
            delete users[userId]
            return { users }
        }),
    upsertRoom: (room) =>
        set((s) => ({ rooms: { ...s.rooms, [room.id]: room } })),

    currentRoomId: 'lobby',
    setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

    messages: {},
    addMessage: (msg) =>
        set((s) => ({
            messages: {
                ...s.messages,
                [msg.room_id]: [...(s.messages[msg.room_id] ?? []), msg].slice(-200),
            },
        })),

    reactions: [],
    addReaction: (reaction) => {
        set((s) => ({ reactions: [...s.reactions, reaction] }))
        setTimeout(() => get().removeReaction(reaction.id), 3500)
    },
    removeReaction: (id) =>
        set((s) => ({ reactions: s.reactions.filter((r) => r.id !== id) })),

    pendingInvite: null,
    setPendingInvite: (inv) => set({ pendingInvite: inv }),

    showEmojiPanel: false,
    showAIPanel: true,
    showChat: true,
    toggleEmojiPanel: () => set((s) => ({ showEmojiPanel: !s.showEmojiPanel })),
    toggleAIPanel: () => set((s) => ({ showAIPanel: !s.showAIPanel })),
    toggleChat: () => set((s) => ({ showChat: !s.showChat })),

    wsConnected: false,
    setWsConnected: (connected) => set({ wsConnected: connected }),

    isMuted: false,
    isCameraOff: false,
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),

    ambientSound: null,
    setAmbientSound: (sound) => set({ ambientSound: sound }),
}))
