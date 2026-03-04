import React, { useState } from 'react'
import { useStore, Room, type AppState } from '../../store/useStore'
import { USER_STATUS, USER_STATUS_CONFIG, WS_MESSAGE_TYPE, type UserStatus } from '../../types/enums'

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">🚪 Create a Private Cabin</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            CABIN NAME
                        </label>
                        <input
                            className="input"
                            placeholder="e.g. Design Review, Coffee Break..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            DESCRIPTION (optional)
                        </label>
                        <input
                            className="input"
                            placeholder="What's happening in this cabin?"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                            PICK AN ICON
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {ROOM_EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => setEmoji(e)}
                                    style={{
                                        width: 40, height: 40, fontSize: '1.4rem',
                                        border: `2px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                                        borderRadius: 10,
                                        background: emoji === e ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="private-toggle"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="private-toggle" style={{ fontSize: '13px', cursor: 'pointer' }}>
                            🔒 Private cabin (invite only)
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 2 }}
                            onClick={() => {
                                if (name.trim()) {
                                    onSubmit(name.trim(), emoji, desc.trim(), isPrivate)
                                    onClose()
                                }
                            }}
                        >
                            Create Cabin
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
    }

    const createRoom = (name: string, emoji: string, desc: string, isPrivate: boolean) => {
        send(WS_MESSAGE_TYPE.ROOM_CREATE, { name, emoji, description: desc, is_private: isPrivate })
        // Auto-join created room
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
            <div className={`sidebar${isOpen ? ' open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            flexShrink: 0,
                        }}>
                            🏢
                        </div>
                        <div>
                            <h1 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                                RemoteWork
                            </h1>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>
                                TOGETHER
                            </div>
                        </div>
                    </div>

                    {/* Online count */}
                    <div style={{
                        marginTop: '12px',
                        padding: '6px 10px',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#10b981',
                    }}>
                        <div style={{ width: 7, height: 7, background: '#10b981', borderRadius: '50%', animation: 'status-dot 2s infinite' }} />
                        <span>{totalOnline} {totalOnline === 1 ? 'person' : 'people'} online</span>
                    </div>
                </div>

                {/* Rooms section */}
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Spaces</div>

                    {roomList.map((room) => {
                        const memberCount = Object.values(users).filter((u) => u.room_id === room.id).length
                        const isActive = room.id === currentRoomId
                        return (
                            <div
                                key={room.id}
                                className={`room-item ${isActive ? 'active' : ''}`}
                                onClick={() => joinRoom(room.id)}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{room.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="room-name">{room.name}</div>
                                    {room.description && (
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {room.description}
                                        </div>
                                    )}
                                </div>
                                {memberCount > 0 && (
                                    <span className="room-count">{memberCount}</span>
                                )}
                                {room.is_private && room.id !== 'lobby' && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🔒</span>
                                )}
                            </div>
                        )
                    })}

                    {/* Create cabin button */}
                    <button
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '8px 10px', marginTop: '4px', color: 'var(--text-muted)', fontSize: '13px' }}
                        onClick={() => setShowCreateModal(true)}
                    >
                        <span style={{ fontSize: '1rem' }}>➕</span>
                        Create Cabin
                    </button>

                    <div className="divider" />

                    {/* My status */}
                    <div className="sidebar-section-title">My Status</div>
                    <div style={{ position: 'relative' }}>
                        <button
                            className="room-item"
                            style={{ width: '100%', cursor: 'pointer' }}
                            onClick={() => setStatusOpen(!statusOpen)}
                        >
                            <span style={{ fontSize: '1.1rem' }}>
                                {AVATAR_MAP_LOCAL[myUser?.avatar || ''] || '👤'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {myUser?.username || 'You'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {myUser?.status || USER_STATUS.ONLINE} • Click to change
                                </div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
                        </button>

                        {statusOpen && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: '100%',
                                marginBottom: '4px',
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--border-strong)',
                                borderRadius: 12,
                                overflow: 'hidden',
                                zIndex: 50,
                            }}>
                                {STATUSES.map((s) => (
                                    <button
                                        key={s.key}
                                        onClick={() => setStatus(s.key)}
                                        style={{
                                            width: '100%',
                                            display: 'block',
                                            padding: '9px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: s.key === myUser?.status ? s.color : 'var(--text-secondary)',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontWeight: s.key === myUser?.status ? 700 : 400,
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateCabinModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={createRoom}
                />
            )}
        </>
    )
}

const AVATAR_MAP_LOCAL: Record<string, string> = {
    astronaut: '👨‍🚀', robot: '🤖', wizard: '🧙',
    ninja: '🥷', scientist: '👩‍🔬', artist: '👩‍🎨',
    gamer: '🧑‍💻', chef: '👨‍🍳',
}
