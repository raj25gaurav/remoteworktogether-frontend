import React, { useState, useEffect } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { AVATAR_MAP, API_URL } from '../../utils/constants'
import { AVATAR_KEY, type AvatarKey } from '../../types/enums'

const AVATARS = Object.entries(AVATAR_MAP)

const PROFESSIONS = [
    'Software Engineer', 'Designer', 'Product Manager', 'Data Scientist',
    'Marketing', 'Sales', 'DevOps / SRE', 'Founder / CEO', 'Student',
    'Researcher', 'Content Creator', 'Consultant', 'Other',
]

const INTERESTS = [
    '💻 Coding', '🎨 Design', '📊 Data', '🎮 Gaming', '📚 Reading',
    '🎵 Music', '🌍 Travel', '🍕 Food', '🏋️ Fitness', '🎭 Movies',
    '🚀 Startups', '🤖 AI/ML', '📷 Photography', '✍️ Writing',
]

const TAGLINES = [
    'Your virtual HQ — where the coffee is always hot ☕',
    'No pants required. Webcam optional 📹',
    'Your commute just got 100% shorter 🚀',
    'Skip the elevator small-talk. Just vibe 🎵',
]

type Mode = 'choose' | 'login' | 'register'

export default function Landing() {
    const [mode, setMode] = useState<Mode>('choose')
    const [step, setStep] = useState(1) // for registration: 1=creds, 2=profile, 3=interests
    const [taglineIdx, setTaglineIdx] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Registration fields
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [avatar, setAvatar] = useState<AvatarKey>(AVATAR_KEY.ASTRONAUT)
    const [profession, setProfession] = useState('')
    const [bio, setBio] = useState('')
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])

    // Login fields
    const [loginUsername, setLoginUsername] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const setMyUser = useStore((s: AppState) => s.setMyUser)
    const setDbUser = useStore((s: AppState) => s.setDbUser)

    // Live clock
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        const id = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 4000)
        return () => clearInterval(id)
    }, [])

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        )
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
        if (!loginUsername.trim() || !loginPassword) {
            setError('Please enter your username and password')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'Login failed')
                return
            }
            await _clockIn(data.user)
        } catch {
            setError('Cannot reach server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    // ── REGISTER step 1 (credentials) ─────────────────────────────────────────
    const handleRegisterStep1 = () => {
        if (!username.trim() || username.trim().length < 2) {
            setError('Username must be at least 2 characters'); return
        }
        if (!password || password.length < 4) {
            setError('Password must be at least 4 characters'); return
        }
        setError('')
        setStep(2)
    }

    // ── REGISTER step 2 (profile) ──────────────────────────────────────────────
    const handleRegisterStep2 = () => {
        if (!displayName.trim()) {
            setError('Please enter your display name'); return
        }
        if (!profession) {
            setError('Please select your profession'); return
        }
        setError('')
        setStep(3)
    }

    // ── REGISTER step 3 (interests + submit) ──────────────────────────────────
    const handleRegisterFinish = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                    display_name: displayName.trim() || username.trim(),
                    avatar,
                    profession,
                    bio: bio.trim(),
                    interests: selectedInterests,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'Registration failed')
                return
            }
            await _clockIn(data.user)
        } catch {
            setError('Cannot reach server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    // ── Clock In — join WebSocket session after auth ───────────────────────────
    const _clockIn = async (dbUser: any) => {
        try {
            const res = await fetch(
                `${API_URL}/api/join?username=${encodeURIComponent(dbUser.display_name)}&avatar=${dbUser.avatar}&db_user_id=${dbUser.id}`
            )
            const data = await res.json()
            if (data.user) {
                sessionStorage.setItem('clockInTime', Date.now().toString())
                sessionStorage.setItem('dbUserId', dbUser.id)
                setDbUser(dbUser)
                setMyUser(data.user)
            } else {
                setError('Failed to join session. Try again.')
            }
        } catch {
            setError('Cannot connect to server.')
        }
    }

    // ── CHOOSE screen ──────────────────────────────────────────────────────────
    if (mode === 'choose') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                {/* Floating particles */}
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

                <div className="landing-card" style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
                    {/* Live Clock */}
                    <div style={{
                        textAlign: 'center', marginBottom: '24px', padding: '16px',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '16px',
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                            🕐 Office Hours
                        </div>
                        <div className="office-clock-face">{formattedTime}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{formattedDate}</div>
                    </div>

                    <div className="landing-hero" style={{ marginBottom: '28px' }}>
                        <span className="landing-logo">🏢</span>
                        <h1 className="landing-title">
                            <span className="text-gradient">RemoteWork</span><br />
                            <span style={{ color: 'var(--text-primary)' }}>Together</span>
                        </h1>
                        <p className="landing-subtitle" style={{ minHeight: '40px' }}>{TAGLINES[taglineIdx]}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn btn-primary btn-lg" onClick={() => setMode('login')} style={{ width: '100%', fontSize: '15px' }}>
                            🟢 Clock In — I have an account
                        </button>
                        <button className="btn btn-secondary btn-lg" onClick={() => setMode('register')} style={{ width: '100%', fontSize: '15px' }}>
                            ✨ Join the Office — New here?
                        </button>
                    </div>

                    <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[{ icon: '🏢', label: 'Open Floor Plan' }, { icon: '📅', label: 'Meeting Rooms' },
                        { icon: '👥', label: 'Colleague Match' }, { icon: '⏱️', label: 'Work Timer' },
                        { icon: '🔥', label: 'Focus Pomodoro' }, { icon: '🤖', label: 'AI Colleague' }
                        ].map(f => (
                            <div key={f.label} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                border: '1px solid var(--border)', fontSize: '12px',
                                color: 'var(--text-secondary)', fontWeight: 500,
                            }}>
                                <span>{f.icon}</span><span>{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── LOGIN screen ───────────────────────────────────────────────────────────
    if (mode === 'login') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                <div className="landing-card" style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setMode('choose'); setError('') }} style={{ marginBottom: '16px', width: 'fit-content' }}>
                        ← Back
                    </button>
                    <div className="landing-hero" style={{ marginBottom: '24px' }}>
                        <span className="landing-logo" style={{ fontSize: '2.5rem' }}>🔐</span>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
                            <span className="text-gradient">Clock In</span>
                        </h1>
                        <p className="landing-subtitle">Welcome back! Your desk awaits 💻</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                👤 Username
                            </label>
                            <input className="input" placeholder="your_username" value={loginUsername}
                                onChange={e => setLoginUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                🔑 Password
                            </label>
                            <input className="input" type="password" placeholder="••••••••" value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                        </div>
                    </div>

                    {error && <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: '#f43f5e', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>}

                    <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={loading} style={{ width: '100%' }}>
                        {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '🟢 Clock In'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        New here?{' '}
                        <span onClick={() => { setMode('register'); setError('') }} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                            Create an account →
                        </span>
                    </p>
                </div>
            </div>
        )
    }

    // ── REGISTER screens (3-step) ──────────────────────────────────────────────
    const stepLabels = ['Credentials', 'Your Profile', 'Your Interests']
    return (
        <div className="landing">
            <div className="animated-bg" />
            <div className="landing-card" style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { if (step > 1) setStep(s => s - 1); else { setMode('choose'); } setError('') }} style={{ marginBottom: '16px', width: 'fit-content' }}>
                    ← {step > 1 ? 'Back' : 'Choose'}
                </button>

                {/* Step indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {stepLabels.map((label, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <div style={{
                                height: '3px', borderRadius: '99px', width: '100%',
                                background: i < step ? 'var(--accent)' : 'var(--border)',
                                transition: 'background 0.3s',
                            }} />
                            <span style={{ fontSize: '10px', color: i < step ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i + 1 === step ? 700 : 400 }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Credentials */}
                {step === 1 && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Create Your Badge 🪪</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Choose a username and password to secure your desk</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Username</label>
                                <input className="input" placeholder="e.g. alex_j" value={username} onChange={e => setUsername(e.target.value)} autoFocus maxLength={30} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Password</label>
                                <input className="input" type="password" placeholder="Min. 4 characters" value={password} onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleRegisterStep1()} />
                            </div>
                        </div>
                        {error && <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: '#f43f5e', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>}
                        <button className="btn btn-primary btn-lg" onClick={handleRegisterStep1} style={{ width: '100%' }}>Next →</button>
                    </>
                )}

                {/* Step 2: Profile */}
                {step === 2 && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Introduce Yourself 👋</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tell the office who you are — nothing too formal!</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Display Name (what colleagues see)</label>
                                <input className="input" placeholder="e.g. Alex Johnson" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus maxLength={30} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>What do you do?</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {PROFESSIONS.map(p => (
                                        <button key={p} onClick={() => setProfession(p)} className={`btn btn-sm ${profession === p ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px' }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>One-liner bio (optional)</label>
                                <input className="input" placeholder="e.g. Building the future one bug at a time 🐛" value={bio} onChange={e => setBio(e.target.value)} maxLength={80} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>🪪 Pick Your Work Persona</label>
                                <div className="avatar-selector" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                    {AVATARS.map(([key, emoji]) => (
                                        <div key={key} className={`avatar-option ${avatar === key ? 'selected' : ''}`} onClick={() => setAvatar(key as AvatarKey)}>
                                            <span className="emoji">{emoji}</span>
                                            <span className="label">{key}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {error && <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: '#f43f5e', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>}
                        <button className="btn btn-primary btn-lg" onClick={handleRegisterStep2} style={{ width: '100%' }}>Next →</button>
                    </>
                )}

                {/* Step 3: Interests */}
                {step === 3 && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Pick Your Vibes 🎯</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>We'll suggest colleagues who share your interests</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                            {INTERESTS.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`btn btn-sm ${selectedInterests.includes(interest) ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '13px', padding: '8px 14px' }}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
                            {selectedInterests.length === 0 ? 'Select at least 1 interest to get better matches!' : `${selectedInterests.length} selected ✓`}
                        </div>
                        {error && <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: '#f43f5e', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>}
                        <button className="btn btn-primary btn-lg" onClick={handleRegisterFinish} disabled={loading} style={{ width: '100%' }}>
                            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating your desk...</> : '🏢 Join the Office!'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            Already clocked in before?{' '}
                            <span onClick={() => setMode('login')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Sign in →</span>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
