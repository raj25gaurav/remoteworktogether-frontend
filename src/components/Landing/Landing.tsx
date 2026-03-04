import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { AVATAR_MAP, API_URL } from '../../utils/constants'

const AVATARS = Object.entries(AVATAR_MAP)

export default function Landing() {
    const [username, setUsername] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('astronaut')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const setMyUser = useStore((s) => s.setMyUser)

    const handleJoin = async () => {
        if (!username.trim()) {
            setError('Please enter your name!')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(
                `${API_URL}/api/join?username=${encodeURIComponent(username.trim())}&avatar=${selectedAvatar}`
            )
            const data = await res.json()
            if (data.user) {
                setMyUser(data.user)
            } else {
                setError('Failed to join. Try again.')
            }
        } catch (e) {
            setError('Cannot connect to server. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="landing">
            <div className="animated-bg" />
            {/* Floating particles */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {['🛸', '⭐', '🌙', '✨', '💫', '🚀'].map((emoji, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: `${10 + i * 15}%`,
                            left: `${5 + i * 14}%`,
                            fontSize: `${1 + (i % 3) * 0.5}rem`,
                            opacity: 0.15,
                            animation: `avatar-idle ${3 + i}s ease-in-out infinite`,
                            animationDelay: `${i * 0.5}s`,
                        }}
                    >
                        {emoji}
                    </div>
                ))}
            </div>

            <div className="landing-card" style={{ position: 'relative', zIndex: 1 }}>
                <div className="landing-hero">
                    <span className="landing-logo">🏢</span>
                    <h1 className="landing-title">
                        <span className="text-gradient">RemoteWork</span>
                        <br />
                        <span style={{ color: 'var(--text-primary)' }}>Together</span>
                    </h1>
                    <p className="landing-subtitle">
                        Your virtual office where remote teams stay connected,<br />
                        collaborate, and have fun — all in one space 🚀
                    </p>
                </div>

                {/* Username input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Your Display Name
                    </label>
                    <input
                        className="input"
                        placeholder="e.g. Alex Johnson"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        maxLength={30}
                        autoFocus
                    />
                </div>

                {/* Avatar selector */}
                <div style={{ marginBottom: '28px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        Choose Your Avatar
                    </label>
                    <div className="avatar-selector">
                        {AVATARS.map(([key, emoji]) => (
                            <div
                                key={key}
                                className={`avatar-option ${selectedAvatar === key ? 'selected' : ''}`}
                                onClick={() => setSelectedAvatar(key)}
                            >
                                <span className="emoji">{emoji}</span>
                                <span className="label">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '10px',
                        color: '#f43f5e',
                        fontSize: '13px',
                        marginBottom: '16px',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleJoin}
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                            Joining...
                        </>
                    ) : (
                        <>🚀 Enter Virtual Office</>
                    )}
                </button>

                {/* Features preview */}
                <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { icon: '🏠', label: 'Main Lobby' },
                        { icon: '🚪', label: 'Private Cabins' },
                        { icon: '🎭', label: 'Emoji Reactions' },
                        { icon: '🤖', label: 'AI Assistant' },
                        { icon: '📹', label: 'Video Calls' },
                        { icon: '🎵', label: 'Ambient Music' },
                    ].map((f) => (
                        <div key={f.label} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                        }}>
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
