import React, { useState, useEffect, useRef, useCallback } from 'react'
import { API_URL, AVATAR_MAP } from '../../utils/constants'

interface DMMessage {
    id: string
    from_id: string
    to_id: string
    content: string
    created_at: number
    is_read: boolean
}

interface DMUser {
    id: string
    display_name: string
    avatar: string
    is_online: boolean
}

interface DirectMessageOverlayProps {
    myDbUserId: string
    otherUser: DMUser
    onClose: () => void
}

function formatTime(ts: number): string {
    const d = new Date(ts * 1000)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function DirectMessageOverlay({ myDbUserId, otherUser, onClose }: DirectMessageOverlayProps) {
    const [messages, setMessages] = useState<DMMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/dm/history?user_a=${myDbUserId}&user_b=${otherUser.id}&limit=60`)
            const data = await res.json()
            setMessages(data.messages || [])
        } catch { }
        finally { setLoading(false) }
    }, [myDbUserId, otherUser.id])

    const markRead = useCallback(async () => {
        await fetch(`${API_URL}/api/dm/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from_id: otherUser.id, to_id: myDbUserId }),
        }).catch(() => { })
    }, [myDbUserId, otherUser.id])

    useEffect(() => {
        fetchHistory()
        markRead()
        // Poll for new messages every 5 seconds
        pollRef.current = setInterval(() => {
            fetchHistory()
            markRead()
        }, 5000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [fetchHistory, markRead])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input on open
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [])

    const sendMessage = async () => {
        const text = input.trim()
        if (!text || sending) return
        setSending(true)
        setInput('')
        // Optimistic update
        const optimistic: DMMessage = {
            id: 'tmp-' + Date.now(),
            from_id: myDbUserId,
            to_id: otherUser.id,
            content: text,
            created_at: Date.now() / 1000,
            is_read: false,
        }
        setMessages(prev => [...prev, optimistic])

        try {
            await fetch(`${API_URL}/api/dm/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from_id: myDbUserId, to_id: otherUser.id, content: text }),
            })
            // Fetch real messages (replaces optimistic)
            await fetchHistory()
        } catch { }
        finally { setSending(false) }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const myAvatar = AVATAR_MAP['astronaut' as keyof typeof AVATAR_MAP] || '👤'
    const theirAvatar = AVATAR_MAP[otherUser.avatar as keyof typeof AVATAR_MAP] || '👤'

    return (
        <div style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
            width: 340, maxHeight: 520,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-strong)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)',
            display: 'flex', flexDirection: 'column',
            animation: 'slide-in-up 0.25s ease',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.08))',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                    }}>
                        {theirAvatar}
                    </div>
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                        background: otherUser.is_online ? '#10b981' : '#4d607a',
                        borderRadius: '50%', border: '2px solid var(--bg-panel)',
                    }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {otherUser.display_name}
                    </div>
                    <div style={{ fontSize: '10px', color: otherUser.is_online ? '#10b981' : 'var(--text-muted)' }}>
                        {otherUser.is_online ? '🟢 Online' : '⚫ Offline'}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '16px', padding: '4px',
                        borderRadius: 6, transition: 'color 0.15s',
                        fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '6px',
                maxHeight: 360,
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <div className="spinner" style={{ margin: '0 auto 10px' }} />
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                        Start a conversation with {otherUser.display_name}!
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMine = msg.from_id === myDbUserId
                        return (
                            <div key={msg.id} style={{
                                display: 'flex',
                                flexDirection: isMine ? 'row-reverse' : 'row',
                                alignItems: 'flex-end', gap: '6px',
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
                                }}>
                                    {isMine ? myAvatar : theirAvatar}
                                </div>
                                {/* Bubble */}
                                <div style={{
                                    maxWidth: '72%',
                                    padding: '8px 12px',
                                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: isMine
                                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                        : 'var(--bg-card)',
                                    border: isMine ? 'none' : '1px solid var(--border)',
                                    boxShadow: isMine ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                                }}>
                                    <div style={{
                                        fontSize: '12px', lineHeight: 1.5,
                                        color: isMine ? '#1a0a00' : 'var(--text-primary)',
                                        wordBreak: 'break-word',
                                    }}>
                                        {msg.content}
                                    </div>
                                    <div style={{
                                        fontSize: '9px', marginTop: '4px', opacity: 0.6,
                                        textAlign: isMine ? 'right' : 'left',
                                        color: isMine ? '#1a0a00' : 'var(--text-muted)',
                                    }}>
                                        {formatTime(msg.created_at)}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                display: 'flex', gap: '8px', padding: '10px 12px',
                borderTop: '1px solid var(--border)', flexShrink: 0,
                background: 'var(--bg-panel)',
            }}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${otherUser.display_name}...`}
                    maxLength={2000}
                    style={{
                        flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 12px', color: 'var(--text-primary)',
                        fontSize: '12px', outline: 'none', fontFamily: 'var(--font-base)',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{
                        background: input.trim() ? 'var(--accent)' : 'var(--bg-card)',
                        border: 'none', borderRadius: 10, padding: '8px 14px',
                        cursor: input.trim() ? 'pointer' : 'default',
                        color: input.trim() ? '#1a0a00' : 'var(--text-muted)',
                        fontSize: '16px', transition: 'all 0.15s', flexShrink: 0,
                        fontFamily: 'inherit',
                    }}
                >
                    {sending ? '...' : '➤'}
                </button>
            </div>
        </div>
    )
}
