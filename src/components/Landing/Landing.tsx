import React, { useState, useEffect } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { AVATAR_MAP, API_URL } from '../../utils/constants'
import { AVATAR_KEY, type AvatarKey } from '../../types/enums'

const AVATARS = Object.entries(AVATAR_MAP)

// Fun office-themed taglines that cycle
const TAGLINES = [
    'Your virtual HQ — where the coffee is always hot ☕',
    'Async is so last year. Be here now 🏢',
    'No pants required. Webcam optional 📹',
    'Your commute just got 100% shorter 🚀',
    'Skip the elevator small-talk. Just vibe 🎵',
]

export default function Landing() {
    const [username, setUsername] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>(AVATAR_KEY.ASTRONAUT)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [taglineIdx, setTaglineIdx] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())
    const setMyUser = useStore((s: AppState) => s.setMyUser)

    // Live clock
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    // Cycle taglines
    useEffect(() => {
        const id = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 4000)
        return () => clearInterval(id)
    }, [])

    const handleClockIn = async () => {
        if (!username.trim()) {
            setError('Please enter your name before clocking in!')
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
                // Save clock-in time to sessionStorage so App.tsx can show the timer
                sessionStorage.setItem('clockInTime', Date.now().toString())
                setMyUser(data.user)
            } else {
                setError('Failed to clock in. Please try again.')
            }
        } catch {
            setError('Cannot reach the office server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    return (
        <div className="landing">
            <div className="animated-bg" />

            {/* Floating office-themed particles */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {['☕', '💼', '📋', '💻', '📊', '🖊️', '📌', '🗂️'].map((emoji, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: `${8 + i * 12}%`,
                        left: `${3 + i * 12}%`,
                        fontSize: `${1 + (i % 3) * 0.4}rem`,
                        opacity: 0.1,
                        animation: `avatar-idle ${4 + i}s ease-in-out infinite`,
                        animationDelay: `${i * 0.6}s`,
                    }}>{emoji}</div>
                ))}
            </div>

            <div className="landing-card" style={{ position: 'relative', zIndex: 1 }}>
                {/* Live Office Clock */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: '16px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🕐 Office Hours
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                        {formattedTime}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {formattedDate}
                    </div>
                </div>

                <div className="landing-hero" style={{ marginBottom: '20px' }}>
                    <span className="landing-logo">🏢</span>
                    <h1 className="landing-title">
                        <span className="text-gradient">RemoteWork</span>
                        <br />
                        <span style={{ color: 'var(--text-primary)' }}>Together</span>
                    </h1>
                    <p className="landing-subtitle" style={{ transition: 'opacity 0.5s', minHeight: '40px' }}>
                        {TAGLINES[taglineIdx]}
                    </p>
                </div>

                {/* Name input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        👤 Your Name Badge
                    </label>
                    <input
                        className="input"
                        placeholder="e.g. Alex Johnson"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleClockIn()}
                        maxLength={30}
                        autoFocus
                    />
                </div>

                {/* Avatar selector */}
                <div style={{ marginBottom: '28px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        🪪 Pick Your Work Persona
                    </label>
                    <div className="avatar-selector">
                        {AVATARS.map(([key, emoji]) => (
                            <div
                                key={key}
                                className={`avatar-option ${selectedAvatar === key ? 'selected' : ''}`}
                                onClick={() => setSelectedAvatar(key as AvatarKey)}
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

                {/* CLOCK IN Button */}
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleClockIn}
                    disabled={loading}
                    style={{ width: '100%', fontSize: '16px', letterSpacing: '0.5px' }}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                            Signing you in...
                        </>
                    ) : (
                        <>🟢 Clock In — Start Your Day</>
                    )}
                </button>

                {/* Office feature badges */}
                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                        { icon: '🏢', label: 'Open Floor Plan' },
                        { icon: '🚪', label: 'Meeting Rooms' },
                        { icon: '📹', label: 'Face-to-Face Calls' },
                        { icon: '💬', label: 'Office Chat' },
                        { icon: '🎉', label: 'Water Cooler' },
                        { icon: '🤖', label: 'AI Colleague' },
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
