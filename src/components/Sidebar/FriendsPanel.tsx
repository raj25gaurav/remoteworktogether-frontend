import React, { useState, useEffect, useCallback } from 'react'
import { API_URL, AVATAR_MAP } from '../../utils/constants'
import DirectMessageOverlay from './DirectMessageOverlay'

// ── Types ─────────────────────────────────────────────────────────────────────
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
    sender_display_name: string
    sender_avatar: string
    sender_profession: string
}

interface FriendsPanelProps {
    myDbUserId: string | null
    currentOnlineIds: string[]
    onPingUser?: (userId: string, displayName: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
            background: `${color}18`, border: `1px solid ${color}30`, color,
        }}>
            {score}% <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FriendsPanel({ myDbUserId, currentOnlineIds, onPingUser }: FriendsPanelProps) {
    const [suggestions, setSuggestions] = useState<FriendUser[]>([])
    const [friends, setFriends] = useState<FriendUser[]>([])
    const [pending, setPending] = useState<PendingRequest[]>([])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'friends' | 'discover' | 'requests'>('friends')
    const [search, setSearch] = useState('')
    const [dmUser, setDmUser] = useState<FriendUser | null>(null)

    // ── Fetch all data ────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!myDbUserId) { setLoading(false); return }
        const onlineParam = currentOnlineIds.join(',')
        try {
            const [sugRes, frRes, pendRes, unreadRes] = await Promise.all([
                fetch(`${API_URL}/api/friends/suggest/${myDbUserId}?online_ids=${onlineParam}`),
                fetch(`${API_URL}/api/friends/list/${myDbUserId}?online_ids=${onlineParam}`),
                fetch(`${API_URL}/api/friends/pending/${myDbUserId}`),
                fetch(`${API_URL}/api/dm/unread/${myDbUserId}`),
            ])
            const [sugData, frData, pendData, unreadData] = await Promise.all([
                sugRes.json(), frRes.json(), pendRes.json(), unreadRes.json()
            ])
            setSuggestions(sugData.suggestions || [])
            setFriends(frData.friends || [])
            setPending(pendData.requests || [])
            setUnreadCounts(unreadData.unread || {})
        } catch { }
        finally { setLoading(false) }
    }, [myDbUserId, currentOnlineIds.join(',')])

    // Poll every 10 seconds for live updates
    useEffect(() => {
        if (!myDbUserId) return
        fetchAll()
        const id = setInterval(fetchAll, 10000)
        return () => clearInterval(id)
    }, [myDbUserId])

    // ── Friend request actions ────────────────────────────────────────────────
    const sendRequest = async (toId: string) => {
        if (!myDbUserId) return
        setSentRequests(prev => new Set([...prev, toId]))
        try {
            const res = await fetch(`${API_URL}/api/friends/request`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from_id: myDbUserId, to_id: toId }),
            })
            const data = await res.json()
            if (!data.ok && data.detail) {
                // Already sent or friends - still keep "Sent" state
            }
        } catch { }
    }

    const respond = async (requestId: string, accept: boolean) => {
        if (!myDbUserId) return
        try {
            await fetch(`${API_URL}/api/friends/respond`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: requestId, responder_id: myDbUserId, accept }),
            })
        } catch { }
        // Immediately refresh
        await fetchAll()
        // Switch to friends tab if accepted
        if (accept) setTab('friends')
    }

    // ── Derived ───────────────────────────────────────────────────────────────
    const friendIds = new Set(friends.map(f => f.id))
    const onlineCount = friends.filter(u => u.is_online).length
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)
    const filteredSuggestions = suggestions
        .filter(u => !friendIds.has(u.id))
        .filter(u => !search || u.display_name.toLowerCase().includes(search.toLowerCase()) ||
            u.profession?.toLowerCase().includes(search.toLowerCase()))

    if (!myDbUserId) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                Sign in to see colleagues and friends!
            </div>
        )
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabs = [
        {
            key: 'friends',
            label: friends.length > 0 ? `👥 Friends (${friends.length})` : '👥 Friends',
            badge: totalUnread > 0 ? totalUnread : 0,
        },
        { key: 'discover', label: '🔍 Discover', badge: 0 },
        { key: 'requests', label: '📬 Requests', badge: pending.length },
    ]

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                            flex: 1, padding: '9px 4px', background: 'transparent', border: 'none',
                            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer', fontSize: '11px', fontWeight: tab === t.key ? 700 : 500,
                            color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                            transition: 'all 0.15s', fontFamily: 'var(--font-base)',
                            position: 'relative',
                        }}>
                            {t.label}
                            {t.badge > 0 && (
                                <span style={{
                                    position: 'absolute', top: 4, right: 4,
                                    background: '#ef4444', color: '#fff',
                                    borderRadius: '99px', fontSize: '9px', fontWeight: 800,
                                    padding: '1px 5px', minWidth: 14, lineHeight: '14px',
                                    textAlign: 'center',
                                }}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* ── FRIENDS TAB ── */}
                    {tab === 'friends' && (
                        <div style={{ padding: '10px 8px' }}>
                            {loading ? (
                                <LoadingEl />
                            ) : friends.length === 0 ? (
                                <EmptyEl icon="🤝" title="No friends yet" sub={<>Go to <strong>Discover</strong> to send friend requests.</>} />
                            ) : (
                                <>
                                    {onlineCount > 0 && (
                                        <SectionLabel color="#10b981" text={`🟢 Online (${onlineCount})`} />
                                    )}
                                    {friends.filter(u => u.is_online).map(user => (
                                        <FriendRow key={user.id}
                                            user={user}
                                            unread={unreadCounts[user.id] || 0}
                                            onMessage={() => setDmUser(user)}
                                            onPing={onPingUser}
                                        />
                                    ))}
                                    {friends.some(u => !u.is_online) && (
                                        <SectionLabel color="var(--text-muted)" text="⚫ Offline" style={{ marginTop: 10 }} />
                                    )}
                                    {friends.filter(u => !u.is_online).map(user => (
                                        <FriendRow key={user.id}
                                            user={user}
                                            unread={unreadCounts[user.id] || 0}
                                            onMessage={() => setDmUser(user)}
                                        />
                                    ))}
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
                            <div style={{ padding: '4px 8px' }}>
                                {loading ? <LoadingEl /> : filteredSuggestions.length === 0 ? (
                                    <EmptyEl icon="🔍" title="No results" sub="Try a different search." />
                                ) : (
                                    filteredSuggestions.map(user => (
                                        <SuggestRow key={user.id} user={user}
                                            sent={sentRequests.has(user.id)}
                                            onSend={() => sendRequest(user.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── REQUESTS TAB ── */}
                    {tab === 'requests' && (
                        <div style={{ padding: '10px 8px' }}>
                            {pending.length === 0 ? (
                                <EmptyEl icon="📬" title="No pending requests" sub="When someone adds you, it will appear here." />
                            ) : (
                                pending.map(req => (
                                    <RequestRow key={req.id} req={req}
                                        onAccept={() => respond(req.id, true)}
                                        onDecline={() => respond(req.id, false)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={fetchAll}
                        style={{ width: '100%', fontSize: '11px', color: 'var(--text-muted)' }}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* DM Overlay */}
            {dmUser && myDbUserId && (
                <DirectMessageOverlay
                    myDbUserId={myDbUserId}
                    otherUser={dmUser}
                    onClose={() => setDmUser(null)}
                />
            )}
        </>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ color, text, style }: { color: string; text: string; style?: React.CSSProperties }) {
    return (
        <div style={{
            fontSize: '10px', fontWeight: 700, color, letterSpacing: '1px',
            textTransform: 'uppercase', marginBottom: '6px', padding: '0 4px',
            ...style,
        }}>
            {text}
        </div>
    )
}

function LoadingEl() {
    return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />Loading...
        </div>
    )
}

function EmptyEl({ icon, title, sub }: { icon: string; title: string; sub: React.ReactNode }) {
    return (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '11px' }}>{sub}</div>
        </div>
    )
}

function FriendRow({ user, unread, onMessage, onPing }: {
    user: FriendUser
    unread: number
    onMessage: () => void
    onPing?: (id: string, name: string) => void
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 8px', borderRadius: 10, marginBottom: '2px',
            transition: 'background 0.15s', cursor: 'pointer',
        }}
            onClick={onMessage}
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
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {user.display_name}
                    <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>✓</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.profession || 'Remote worker'}
                    {user.last_seen && !user.is_online && <span> · {timeSince(user.last_seen)}</span>}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                {unread > 0 && (
                    <span style={{
                        background: '#ef4444', color: '#fff', borderRadius: 99,
                        fontSize: '9px', fontWeight: 800, padding: '2px 5px', minWidth: 16, textAlign: 'center',
                    }}>
                        {unread}
                    </span>
                )}
                <button
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '13px', padding: '4px 6px' }}
                    onClick={e => { e.stopPropagation(); onMessage() }}
                    title="Message"
                >
                    💬
                </button>
                {user.is_online && onPing && (
                    <button
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '13px', padding: '4px 6px' }}
                        onClick={e => { e.stopPropagation(); onPing(user.id, user.display_name) }}
                        title="Ping user"
                    >
                        📨
                    </button>
                )}
            </div>
        </div>
    )
}

function SuggestRow({ user, sent, onSend }: {
    user: FriendUser
    sent: boolean
    onSend: () => void
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 8px', borderRadius: 10, marginBottom: '2px',
            transition: 'background 0.15s',
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
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                    {user.display_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.profession || 'Remote worker'}
                </div>
                {user.similarity !== undefined && user.similarity > 0 && (
                    <div style={{ marginTop: '3px' }}><SimilarityBadge score={user.similarity} /></div>
                )}
            </div>
            <div style={{ flexShrink: 0 }}>
                {sent ? (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px' }}>⏳ Sent</span>
                ) : (
                    <button className="btn btn-sm btn-primary"
                        style={{ fontSize: '10px', padding: '4px 10px' }}
                        onClick={onSend}
                    >
                        ➕ Add
                    </button>
                )}
            </div>
        </div>
    )
}

function RequestRow({ req, onAccept, onDecline }: {
    req: PendingRequest
    onAccept: () => void
    onDecline: () => void
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 8px', borderRadius: 12, marginBottom: '6px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
        }}>
            <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>
                {AVATAR_MAP[req.sender_avatar as keyof typeof AVATAR_MAP] || '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                    {req.sender_display_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {req.sender_profession || 'Remote worker'} · wants to connect
                </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                <button className="btn btn-sm btn-primary"
                    style={{ fontSize: '12px', padding: '5px 10px', background: '#10b981', border: 'none' }}
                    onClick={onAccept}
                    title="Accept"
                >
                    ✓
                </button>
                <button className="btn btn-sm btn-ghost"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                    onClick={onDecline}
                    title="Decline"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
