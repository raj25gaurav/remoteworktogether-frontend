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

interface PendingRequest {
    id: string
    from_id: string
    to_id: string
    status: string
    rwt_users?: { display_name: string; avatar: string; profession: string }
}

interface FriendsPanelProps {
    myDbUserId: string | null
    currentOnlineIds: string[]
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
    const [suggestions, setSuggestions] = useState<FriendUser[]>([])
    const [friends, setFriends] = useState<FriendUser[]>([])
    const [pending, setPending] = useState<PendingRequest[]>([])
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'friends' | 'discover' | 'requests'>('friends')
    const [search, setSearch] = useState('')

    const fetchAll = async () => {
        if (!myDbUserId) { setLoading(false); return }
        const onlineParam = currentOnlineIds.join(',')
        try {
            const [sugRes, frRes, pendRes] = await Promise.all([
                fetch(`${API_URL}/api/friends/suggest/${myDbUserId}?online_ids=${onlineParam}`),
                fetch(`${API_URL}/api/friends/list/${myDbUserId}?online_ids=${onlineParam}`),
                fetch(`${API_URL}/api/friends/pending/${myDbUserId}`),
            ])
            const [sugData, frData, pendData] = await Promise.all([sugRes.json(), frRes.json(), pendRes.json()])
            setSuggestions(sugData.suggestions || [])
            setFriends(frData.friends || [])
            setPending(pendData.requests || [])
        } catch { }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchAll()
        const id = setInterval(fetchAll, 30000)
        return () => clearInterval(id)
    }, [myDbUserId])

    const sendRequest = async (toId: string) => {
        if (!myDbUserId) return
        setSentRequests(prev => new Set([...prev, toId]))
        await fetch(`${API_URL}/api/friends/request`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from_id: myDbUserId, to_id: toId }),
        }).catch(() => { })
    }

    const respond = async (requestId: string, accept: boolean) => {
        if (!myDbUserId) return
        await fetch(`${API_URL}/api/friends/respond`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId, responder_id: myDbUserId, accept }),
        }).catch(() => { })
        fetchAll()
    }

    if (!myDbUserId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                Sign in to see colleagues and friends!
            </div>
        )
    }

    const onlineCount = friends.filter(u => u.is_online).length
    const filteredSuggestions = suggestions.filter(u =>
        !search || u.display_name.toLowerCase().includes(search.toLowerCase()) ||
        u.profession?.toLowerCase().includes(search.toLowerCase())
    )
    const friendIds = new Set(friends.map(f => f.id))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 8px' }}>
                {[
                    { key: 'friends', label: `👥 Friends${friends.length > 0 ? ` (${friends.length})` : ''}` },
                    { key: 'discover', label: '🔍 Discover' },
                    { key: 'requests', label: `📬${pending.length > 0 ? ` (${pending.length})` : ''}` },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                        flex: 1, padding: '9px 4px', background: 'transparent', border: 'none',
                        borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                        cursor: 'pointer', fontSize: '11px', fontWeight: tab === t.key ? 700 : 500,
                        color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'all 0.15s', fontFamily: 'var(--font-base)',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* ── FRIENDS TAB ── */}
                {tab === 'friends' && (
                    <div style={{ padding: '12px 10px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <div className="spinner" style={{ margin: '0 auto 12px' }} />Loading...
                            </div>
                        ) : friends.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤝</div>
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>No friends yet!</div>
                                <div style={{ fontSize: '12px' }}>Go to <strong>Discover</strong> to send friend requests.</div>
                            </div>
                        ) : (
                            <>
                                {onlineCount > 0 && (
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', padding: '0 4px' }}>
                                        🟢 Online ({onlineCount})
                                    </div>
                                )}
                                {friends.filter(u => u.is_online).map(user => <UserRow key={user.id} user={user} onPing={onPingUser} isFriend />)}
                                {friends.some(u => !u.is_online) && (
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', margin: '12px 4px 8px' }}>
                                        ⚫ Offline
                                    </div>
                                )}
                                {friends.filter(u => !u.is_online).map(user => <UserRow key={user.id} user={user} isFriend />)}
                            </>
                        )}
                    </div>
                )}

                {/* ── DISCOVER TAB ── */}
                {tab === 'discover' && (
                    <div>
                        <div style={{ padding: '10px 10px 4px' }}>
                            <input className="input" placeholder="🔍 Search by name or profession..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                style={{ fontSize: '12px', padding: '7px 12px' }} />
                        </div>
                        <div style={{ padding: '4px 10px' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ margin: '0 auto 12px' }} />
                                </div>
                            ) : filteredSuggestions.filter(u => !friendIds.has(u.id)).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    🔍 No results
                                </div>
                            ) : (
                                filteredSuggestions.filter(u => !friendIds.has(u.id)).map(user => (
                                    <UserRow key={user.id} user={user}
                                        action={
                                            sentRequests.has(user.id) ? (
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px' }}>⏳ Sent</span>
                                            ) : (
                                                <button className="btn btn-sm btn-primary"
                                                    style={{ fontSize: '10px', padding: '4px 8px' }}
                                                    onClick={() => sendRequest(user.id)}>
                                                    ➕ Add
                                                </button>
                                            )
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── REQUESTS TAB ── */}
                {tab === 'requests' && (
                    <div style={{ padding: '12px 10px' }}>
                        {pending.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📬</div>
                                No pending friend requests
                            </div>
                        ) : (
                            pending.map(req => {
                                const sender = req.rwt_users
                                return (
                                    <div key={req.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px', borderRadius: 12, marginBottom: '6px',
                                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                                    }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                        }}>
                                            {AVATAR_MAP[sender?.avatar as keyof typeof AVATAR_MAP] || '👤'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '12px' }}>
                                                {sender?.display_name || 'Someone'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {sender?.profession || 'Remote worker'} • wants to connect
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <button className="btn btn-sm btn-primary"
                                                style={{ fontSize: '10px', padding: '4px 8px' }}
                                                onClick={() => respond(req.id, true)}>
                                                ✓
                                            </button>
                                            <button className="btn btn-sm btn-ghost"
                                                style={{ fontSize: '10px', padding: '4px 8px' }}
                                                onClick={() => respond(req.id, false)}>
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={fetchAll} style={{ width: '100%', fontSize: '11px', color: 'var(--text-muted)' }}>
                    🔄 Refresh
                </button>
            </div>
        </div>
    )
}

// ── Shared row component ──────────────────────────────────────────────────────
function UserRow({ user, action, onPing, isFriend }: {
    user: FriendUser
    action?: React.ReactNode
    onPing?: (id: string, name: string) => void
    isFriend?: boolean
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 6px', borderRadius: 10, marginBottom: '2px',
            transition: 'background 0.15s', cursor: 'default',
        }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                }}>
                    {AVATAR_MAP[user.avatar as keyof typeof AVATAR_MAP] || '👤'}
                </div>
                <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: 9, height: 9,
                    background: user.is_online ? '#10b981' : '#4d607a',
                    borderRadius: '50%', border: '2px solid var(--bg-panel)',
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {user.display_name}
                    {isFriend && <span style={{ fontSize: '9px', color: '#10b981' }}>✓ friend</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.profession || 'Remote worker'}
                    {user.last_seen && !user.is_online && <span> · {timeSince(user.last_seen)}</span>}
                </div>
                {user.similarity !== undefined && user.similarity > 0 && (
                    <div style={{ marginTop: '3px' }}><SimilarityBadge score={user.similarity} /></div>
                )}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: '4px' }}>
                {action}
                {isFriend && user.is_online && onPing && (
                    <button className="btn btn-sm btn-ghost"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => onPing(user.id, user.display_name)}
                        title={`Ping ${user.display_name}`}>
                        📨
                    </button>
                )}
            </div>
        </div>
    )
}
