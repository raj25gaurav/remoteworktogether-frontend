import React, { useState, useRef, useEffect } from 'react'
import { useStore, type AppState } from './store/useStore'
import Landing from './components/Landing/Landing'
import { Toaster, toast } from 'react-hot-toast'
import { API_URL } from './utils/constants'

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    emotion?: string;
}

export default function App() {
    const myUser = useStore((s: AppState) => s.myUser)
    const setMyUser = useStore((s: AppState) => s.setMyUser)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!myUser) return;
        // Reset messages on login
        setMessages([
            { role: 'assistant', content: `Hi ${myUser.username}! I'm the AI Recruiter & Referral Assistant. How can I help you today?` }
        ])
    }, [myUser])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (!myUser) {
        return <Landing />
    }

    const handleSignOut = () => {
        setMyUser(null)
    }

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/recruiter-ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    user_id: myUser.id,
                    username: myUser.username,
                    history: messages.slice(-10)
                }),
            });
            const data = await res.json();
            if (data.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response, emotion: data.emotion }]);
            } else {
                toast.error('AI is taking a break.');
            }
        } catch (error) {
            toast.error('Network error communicating with AI.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a14' }}>
            <div className="animated-bg" />
            <Toaster position="top-center" />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px',
                    background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🤖</div>
                        <div>
                            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white' }}>AI Recruiter Network</h1>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Logged in as {myUser.username}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost" onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>

                {/* Main Chat Interface */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
                    <div style={{
                        width: '100%', maxWidth: '800px', height: '100%',
                        background: 'rgba(15, 20, 30, 0.85)', borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(10px)'
                    }}>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%', padding: '16px', borderRadius: '12px',
                                    background: msg.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    color: 'white', lineHeight: '1.5'
                                }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                                            🤖 AI Recruiter {msg.emotion ? `[${msg.emotion}]` : ''}
                                        </div>
                                    )}
                                    {msg.content}
                                </div>
                            ))}
                            {loading && (
                                <div style={{ alignSelf: 'flex-start', padding: '16px', color: 'var(--accent)', display: 'flex', gap: '4px' }}>
                                    <div style={{ animation: 'status-dot 1.5s infinite' }}>.</div>
                                    <div style={{ animation: 'status-dot 1.5s infinite', animationDelay: '0.2s' }}>.</div>
                                    <div style={{ animation: 'status-dot 1.5s infinite', animationDelay: '0.4s' }}>.</div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    className="input"
                                    style={{ flex: 1, padding: '16px', fontSize: '15px' }}
                                    placeholder="Tell the AI what you're looking for..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                                <button className="btn btn-primary" style={{ padding: '0 24px', fontSize: '15px' }} onClick={sendMessage} disabled={loading}>
                                    Send
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
