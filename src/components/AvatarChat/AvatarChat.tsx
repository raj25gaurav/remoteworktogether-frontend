import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { AvatarDisplay } from '../Lobby/UserCard'
import { API_URL } from '../../utils/constants'

interface AIMessage {
    role: 'user' | 'assistant'
    content: string
    emotion?: string
}

const ARIA_EMOTIONS: Record<string, string> = {
    happy: '🤗',
    laughing: '😂',
    excited: '🤩',
    thinking: '🤔',
    empathetic: '🥺',
    confused: '😵',
    cool: '😎',
}

export default function AvatarChat({ roomId }: { roomId: string }) {
    const [messages, setMessages] = useState<AIMessage[]>([
        { role: 'assistant', content: "Hey there! 👋 I'm Aria, your virtual office companion! I'm here to make your remote work day brighter. Ask me anything or just say hi! 🌟", emotion: 'happy' },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentEmotion, setCurrentEmotion] = useState('happy')
    const [suggestions, setSuggestions] = useState(['Tell me a joke 🎭', 'Team check-in 👥', 'Work tip 💡'])
    const chatEndRef = useRef<HTMLDivElement>(null)

    const myUser = useStore((s) => s.myUser)
    const users = useStore((s) => s.users)
    const rooms = useStore((s) => s.rooms)

    const room = rooms[roomId]
    const roomMembers = Object.values(users)
        .filter((u) => u.room_id === roomId)
        .map((u) => u.username)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return
        const userMsg: AIMessage = { role: 'user', content: text }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
            const res = await fetch(`${API_URL}/api/avatar/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    user_id: myUser?.id ?? 'unknown',
                    username: myUser?.username ?? 'User',
                    room_id: roomId,
                    room_name: room?.name ?? 'the office',
                    room_members: roomMembers,
                    conversation_history: history,
                }),
            })
            const data = await res.json()
            const aiMsg: AIMessage = {
                role: 'assistant',
                content: data.response,
                emotion: data.emotion,
            }
            setMessages((prev) => [...prev, aiMsg])
            setCurrentEmotion(data.emotion || 'happy')
            if (data.suggestions?.length) setSuggestions(data.suggestions)
        } catch (e) {
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: "Oops! I lost my connection for a sec 🌐 Try again?",
                emotion: 'confused',
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="ai-panel">
            {/* Aria Avatar Header */}
            <div className="ai-avatar-display">
                <div className="ai-avatar-emoji">
                    {ARIA_EMOTIONS[currentEmotion] || '🤗'}
                </div>
                <div className="ai-avatar-name">Aria</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    AI Office Companion
                </div>
                <div style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '999px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    color: '#10b981',
                }}>
                    <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                    Online & Ready
                </div>
            </div>

            {/* Chat history */}
            <div className="ai-chat">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={msg.role === 'assistant' ? 'ai-message' : 'user-message'}
                        style={{ maxWidth: '90%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                        {msg.role === 'assistant' && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                                Aria {ARIA_EMOTIONS[msg.emotion || 'happy']}
                            </div>
                        )}
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div className="ai-message" style={{ maxWidth: '80%' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} style={{
                                    width: 6, height: 6, background: 'var(--accent)',
                                    borderRadius: '50%',
                                    animation: `status-dot 1s ease-in-out infinite`,
                                    animationDelay: `${i * 0.2}s`,
                                }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div className="ai-suggestions">
                {suggestions.map((s) => (
                    <button key={s} className="ai-suggestion-btn" onClick={() => sendMessage(s)}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="ai-input-area">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        className="input"
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                        placeholder="Chat with Aria..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                    />
                    <button
                        className="btn btn-primary btn-icon"
                        style={{ flexShrink: 0 }}
                        onClick={() => sendMessage(input)}
                        disabled={loading}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    )
}
