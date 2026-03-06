import React, { useState, useEffect } from 'react'
import { API_URL, AVATAR_MAP } from '../../utils/constants'

interface FriendUser {
    id: string
    username: string
    display_name: string
    avatar: string
    profession: string
    interests?: string[]
    similarity?: number
    is_online: boolean
    last_seen?: number
}

interface FriendsPanelProps {
    myDbUserId: string | null
    currentOnlineIds: string[] // in-session WS user ids — from useStore users
    onPingUser?: (userId: string, displayName: string) => void
}

function timeSince(ts: number): string {
    const diff = Math.floor((Date.now() / 1000) - ts)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function SimilarityBadge({ score }: { score: number }) {
    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#8899b4'
    const label = score >= 70 ? 'Great match!' : score >= 40 ? 'Similar' : 'Different vibes'
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
            background: `${color}18`, border: `1px solid ${color}30`, color,
        }}>
            <span>{score}%</span>
            <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>
        </div>
    )
}

export default function FriendsPanel({ myDbUserId, currentOnlineIds, onPingUser }: FriendsPanelProps) {
    const [users, setUsers] = useState<FriendUser[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'online' | 'similar'>('all')
    const [search, setSearch] = useState('')

    const fetchFriends = async () => {
        if (!myDbUserId) {
            setLoading(false)
            return
        }
        try {
            const onlineParam = currentOnlineIds.join(',')
            const res = await fetch(`${API_URL}/api/friends/suggest/${myDbUserId}?online_ids=${onlineParam}`)
            const data = await res.json()
            setUsers(data.suggestions || [])
        } catch {
            // silently fail
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFriends()
        // Refresh every 30 seconds
        const id = setInterval(fetchFriends, 30000)
        return () => clearInterval(id)
    }, [myDbUserId])

    const filtered = users.filter(u => {
        if (filter === 'online' && !u.is_online) return false
        if (filter === 'similar' && (u.similarity ?? 0) < 40) return false
        if (search && !u.display_name.toLowerCase().includes(search.toLowerCase()) &&
            !u.username.toLowerCase().includes(search.toLowerCase()) &&
            !u.profession?.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const onlineCount = users.filter(u => u.is_online).length

    if (!myDbUserId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                Sign in with an account to see colleagues and matches!
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>👥 Colleagues</div>
                    <div style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981',
                    }}>
                        {onlineCount} online
                    </div>
                </div>

                {/* Search */}
                <input
                    className="input"
                    placeholder="🔍 Search colleagues..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ fontSize: '12px', padding: '7px 12px', marginBottom: '8px' }}
                />

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {(['all', 'online', 'similar'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ flex: 1, fontSize: '11px', padding: '4px 0', textTransform: 'capitalize' }}
                        >
                            {f === 'all' ? `All (${users.length})` : f === 'online' ? `🟢 ${onlineCount}` : '💛 Similar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }} />
                        Loading colleagues...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                        {search ? 'No one matched your search' : filter === 'online' ? 'Nobody else is online right now' : 'No similar colleagues yet!'}
                    </div>
                ) : (
                    filtered.map(user => (
                        <div
                            key={user.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 10px', borderRadius: '12px', marginBottom: '4px',
                                background: 'transparent', border: '1px solid transparent',
                                transition: 'all 0.2s', cursor: 'default',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'
                                    ; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                                    ; (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
                            }}
                        >
                            {/* Avatar + online dot */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                }}>
                                    {AVATAR_MAP[user.avatar as keyof typeof AVATAR_MAP] || '👤'}
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
                                    background: user.is_online ? '#10b981' : '#4d607a',
                                    borderRadius: '50%', border: '2px solid var(--bg-panel)',
                                }} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                                        {user.display_name}
                                    </span>
                                    {user.is_online && (
                                        <div style={{ width: 5, height: 5, background: '#10b981', borderRadius: '50%', animation: 'status-dot 2s infinite' }} />
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.profession || 'Remote Worker'}
                                    {user.last_seen && !user.is_online && (
                                        <span style={{ marginLeft: '4px' }}>· {timeSince(user.last_seen)}</span>
                                    )}
                                </div>
                                {user.similarity !== undefined && user.similarity > 0 && (
                                    <div style={{ marginTop: '4px' }}>
                                        <SimilarityBadge score={user.similarity} />
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            {user.is_online && onPingUser && (
                                <button
                                    className="btn btn-sm btn-ghost"
                                    style={{ fontSize: '11px', padding: '4px 8px', flexShrink: 0 }}
                                    onClick={() => onPingUser(user.id, user.display_name)}
                                    title={`Ping ${user.display_name}`}
                                >
                                    📨
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer refresh */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={fetchFriends} style={{ width: '100%', fontSize: '11px', color: 'var(--text-muted)' }}>
                    🔄 Refresh
                </button>
            </div>
        </div>
    )
}
