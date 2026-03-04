import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { AVATAR_MAP } from '../../utils/constants'
import type { ChatMessage } from '../../store/useStore'

interface ChatPanelProps {
    send: (type: string, payload: any) => void
    roomId: string
    onToggleEmoji: () => void
}

function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel({ send, roomId, onToggleEmoji }: ChatPanelProps) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    // Use stable selector: get the messages map, then derive room messages
    const allMessages = useStore((s) => s.messages)
    const messages = useMemo(() => allMessages[roomId] ?? [], [allMessages, roomId])
    const myUser = useStore((s) => s.myUser)
    const showChat = useStore((s) => s.showChat)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = (content?: string) => {
        const text = content || input.trim()
        if (!text) return
        send('chat_message', {
            content: text,
            room_id: roomId,
            message_type: 'text',
        })
        setInput('')
    }

    if (!showChat) return null

    return (
        <div className="chat-panel">
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: '16px' }}>💬</span>
                <span style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>Chat</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{messages.length} msgs</span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '20px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                        No messages yet.<br />Say hi to the team!
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatMsgItem key={msg.id} msg={msg} isMe={msg.sender_id === myUser?.id} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <button className="btn btn-ghost btn-icon" onClick={onToggleEmoji} title="Emoji & GIF">
                    😄
                </button>
                <input
                    className="input"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                    className="btn btn-primary btn-icon"
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                >
                    ➤
                </button>
            </div>
        </div>
    )
}

function ChatMsgItem({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
    const avatarEmoji = AVATAR_MAP[msg.avatar || ''] || '👤'

    if (msg.message_type === 'gif') {
        return (
            <div className="chat-message">
                <div style={{ fontSize: '1.2rem' }}>{avatarEmoji}</div>
                <div className="chat-message-content">
                    <div className="chat-message-header">
                        <span className="chat-username" style={{ color: msg.color || 'var(--accent-light)' }}>
                            {msg.username}
                        </span>
                        <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="chat-text gif">
                        <img src={msg.content} alt="GIF" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`chat-message ${isMe ? 'flex-row-reverse' : ''}`}
            style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}
        >
            <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{avatarEmoji}</div>
            <div className="chat-message-content" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div className="chat-message-header" style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <span className="chat-username" style={{ color: msg.color || 'var(--accent-light)' }}>
                        {isMe ? 'You' : msg.username}
                    </span>
                    <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                    className="chat-text"
                    style={{
                        background: isMe ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                        border: `1px solid ${isMe ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                        borderRadius: isMe ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                        padding: '8px 12px',
                    }}
                >
                    {msg.content}
                </div>
            </div>
        </div>
    )
}
