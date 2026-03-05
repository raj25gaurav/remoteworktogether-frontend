import React, { useState } from 'react'
import { useStore, Room, type AppState } from '../../store/useStore'
import { USER_STATUS, USER_STATUS_CONFIG, WS_MESSAGE_TYPE, type UserStatus } from '../../types/enums'
import { AVATAR_MAP } from '../../utils/constants'

interface SidebarProps {
    send: (type: string, payload: any) => void
    currentRoomId: string
    isOpen?: boolean
    onClose?: () => void
}

const ROOM_EMOJIS = ['🚪', '🏠', '🎮', '☕', '🎸', '🎨', '💻', '🏋️', '🎯', '🌟']

function CreateCabinModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void
    onSubmit: (name: string, emoji: string, desc: string, isPrivate: boolean) => void
}) {
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState('🚪')
    const [desc, setDesc] = useState('')
    const [isPrivate, setIsPrivate] = useState(true)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Create Meeting Room</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g. Design Review, Standup..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description (optional)
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="What's this meeting about?"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Icon
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {ROOM_EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => setEmoji(e)}
                                    className={`w-10 h-10 text-lg rounded-lg border-2 transition-all ${
                                        emoji === e
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="private-toggle"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-blue-500"
                        />
                        <label htmlFor="private-toggle" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                            Private meeting room (invite only)
                        </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (name.trim()) {
                                    onSubmit(name.trim(), emoji, desc.trim(), isPrivate)
                                    onClose()
                                }
                            }}
                            className="flex-[2] px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                        >
                            Create Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Sidebar({ send, currentRoomId, isOpen, onClose }: SidebarProps) {
    const rooms = useStore((s: AppState) => s.rooms)
    const users = useStore((s: AppState) => s.users)
    const myUser = useStore((s: AppState) => s.myUser)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)

    const roomList = Object.values(rooms)
    const totalOnline = Object.keys(users).length

    const joinRoom = (roomId: string) => {
        if (roomId === currentRoomId) return
        send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: roomId })
        onClose?.()
    }

    const createRoom = (name: string, emoji: string, desc: string, isPrivate: boolean) => {
        send(WS_MESSAGE_TYPE.ROOM_CREATE, { name, emoji, description: desc, is_private: isPrivate })
        setTimeout(() => {
            const newRoom = Object.values(useStore.getState().rooms).find(
                (r) => r.name === name && r.created_by === myUser?.id
            )
            if (newRoom) send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: newRoom.id })
        }, 500)
    }

    const setStatus = (status: string) => {
        send(WS_MESSAGE_TYPE.STATUS_UPDATE, { status })
        setStatusOpen(false)
    }

    const STATUSES: Array<{ key: UserStatus; label: string; color: string }> = [
        { key: USER_STATUS.ONLINE, label: USER_STATUS_CONFIG[USER_STATUS.ONLINE].label, color: USER_STATUS_CONFIG[USER_STATUS.ONLINE].color },
        { key: USER_STATUS.BUSY, label: USER_STATUS_CONFIG[USER_STATUS.BUSY].label, color: USER_STATUS_CONFIG[USER_STATUS.BUSY].color },
        { key: USER_STATUS.AWAY, label: USER_STATUS_CONFIG[USER_STATUS.AWAY].label, color: USER_STATUS_CONFIG[USER_STATUS.AWAY].color },
        { key: USER_STATUS.FOCUS, label: USER_STATUS_CONFIG[USER_STATUS.FOCUS].label, color: USER_STATUS_CONFIG[USER_STATUS.FOCUS].color },
    ]

    return (
        <>
            <aside className={`w-64 h-screen flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 z-40 lg:relative lg:left-0 ${
                isOpen ? 'fixed left-0 top-0 transition-transform duration-300' : 'fixed -left-full top-0 transition-transform duration-300 lg:left-0'
            }`}>
                {/* Logo */}
                <header className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-xl">
                            🏢
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white">
                                RemoteWork
                            </h1>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Together
                            </div>
                        </div>
                    </div>

                    {/* Online count */}
                    <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {totalOnline} {totalOnline === 1 ? 'colleague' : 'colleagues'} checked in
                        </span>
                    </div>
                </header>

                {/* Rooms section */}
                <nav className="flex-1 overflow-y-auto p-3">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-2">
                        Rooms
                    </div>

                    <div className="space-y-1">
                        {roomList.map((room) => {
                            const memberCount = Object.values(users).filter((u) => u.room_id === room.id).length
                            const isActive = room.id === currentRoomId
                            return (
                                <button
                                    key={room.id}
                                    type="button"
                                    onClick={() => joinRoom(room.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <span className="text-lg">{room.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                                            {room.name}
                                        </div>
                                        {room.description && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {room.description}
                                            </div>
                                        )}
                                    </div>
                                    {memberCount > 0 && (
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                            {memberCount}
                                        </span>
                                    )}
                                    {room.is_private && room.id !== 'lobby' && (
                                        <span className="text-xs">🔒</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Create room button */}
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="w-full mt-3 px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span>Create Room</span>
                    </button>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />

                    {/* My status */}
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-2">
                        My Status
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setStatusOpen(!statusOpen)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-xl">
                                {AVATAR_MAP[myUser?.avatar || ''] || '👤'}
                            </span>
                            <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {myUser?.username || 'You'}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {USER_STATUS_CONFIG[myUser?.status as keyof typeof USER_STATUS_CONFIG]?.label || 'In Office'}
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">▾</span>
                        </button>

                        {statusOpen && (
                            <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
                                {STATUSES.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => setStatus(s.key)}
                                        className={`w-full block px-4 py-2 text-sm text-left transition-colors ${
                                            s.key === myUser?.status 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                        style={{ color: s.key === myUser?.status ? s.color : undefined }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </aside>

            {showCreateModal && (
                <CreateCabinModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={createRoom}
                />
            )}
        </>
    )
}

