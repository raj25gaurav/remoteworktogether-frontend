import React, { useState, useEffect } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { API_URL } from '../../utils/constants'

type Mode = 'choose' | 'login' | 'register_candidate' | 'register_organization'

export default function Landing() {
    const [mode, setMode] = useState<Mode>('choose')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Stats
    const [stats, setStats] = useState({ companies: 0, candidates: 0 })

    // Common fields
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Candidate fields
    const [fullName, setFullName] = useState('')
    const [currentOrg, setCurrentOrg] = useState('')
    const [hasReferral, setHasReferral] = useState(false)
    const [skills, setSkills] = useState('')
    const [experience, setExperience] = useState('')
    const [expectedSalary, setExpectedSalary] = useState('')
    const [bio, setBio] = useState('') // Custom questions answer

    // Organization fields
    const [companyName, setCompanyName] = useState('')

    const setMyUser = useStore((s: AppState) => s.setMyUser)

    useEffect(() => {
        // Fetch stats
        fetch(`${API_URL}/api/auth/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => {})
    }, [mode])

    const handleLogin = async () => {
        if (!username.trim() || !password) {
            setError('Please enter your username and password')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'Login failed')
                return
            }
            setMyUser(data.user)
        } catch {
            setError('Cannot reach server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterCandidate = async () => {
        if (!username || !password || !fullName || !currentOrg) {
            setError('Please fill required candidate fields.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/register/candidate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username, password, full_name: fullName, current_org: currentOrg,
                    has_referral: hasReferral, skills: skills.split(',').map(s=>s.trim()),
                    experience_years: parseInt(experience) || 0,
                    expected_salary: parseInt(expectedSalary) || 0,
                    bio
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'Registration failed')
                return
            }
            setMyUser(data.user)
        } catch {
            setError('Cannot reach server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterOrg = async () => {
        if (!username || !password || !companyName) {
            setError('Please fill required organization fields.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/register/organization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username, password, company_name: companyName
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'Registration failed')
                return
            }
            setMyUser(data.user)
        } catch {
            setError('Cannot reach server. Is the backend online?')
        } finally {
            setLoading(false)
        }
    }

    if (mode === 'choose') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                <div className="landing-card" style={{ position: 'relative', zIndex: 1, maxWidth: 500, textAlign: 'center' }}>
                    <div className="landing-hero" style={{ marginBottom: '28px' }}>
                        <span className="landing-logo">🤖</span>
                        <h1 className="landing-title">
                            <span className="text-gradient">AI Recruiter</span><br />
                            <span style={{ color: 'var(--text-primary)', fontSize: '24px' }}>& Referral Network</span>
                        </h1>
                        <p className="landing-subtitle">The intelligent way to switch jobs & find talent.</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '12px', flex: 1, color: 'var(--accent)' }}>
                            <h2 style={{ fontSize: '24px', margin: 0 }}>{stats.companies}</h2>
                            <p style={{ margin: 0, fontSize: '14px' }}>Cos Onboarded</p>
                        </div>
                        <div style={{ background: 'rgba(244,63,94,0.1)', padding: '16px', borderRadius: '12px', flex: 1, color: '#f43f5e' }}>
                            <h2 style={{ fontSize: '24px', margin: 0 }}>{stats.candidates}</h2>
                            <p style={{ margin: 0, fontSize: '14px' }}>Candidates</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn btn-primary btn-lg" onClick={() => setMode('login')} style={{ width: '100%' }}>
                            Sign In
                        </button>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary btn-lg" onClick={() => setMode('register_candidate')} style={{ flex: 1 }}>
                                I'm a Candidate
                            </button>
                            <button className="btn btn-secondary btn-lg" onClick={() => setMode('register_organization')} style={{ flex: 1 }}>
                                I'm an Organization
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (mode === 'login') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                <div className="landing-card" style={{ maxWidth: 400 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMode('choose')} style={{ marginBottom: '16px' }}>← Back</button>
                    <h2>Welcome Back</h2>
                    <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px' }} />
                    {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                    <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </div>
        )
    }

    if (mode === 'register_candidate') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                <div className="landing-card" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMode('choose')} style={{ marginBottom: '16px' }}>← Back</button>
                    <h2>Candidate Registration</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Our AI will ask questions below to match you perfectly.</p>
                    
                    <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" placeholder="Current Organization (e.g. Google)" value={currentOrg} onChange={e => setCurrentOrg(e.target.value)} style={{ marginBottom: '10px' }} />
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
                        <input type="checkbox" checked={hasReferral} onChange={e => setHasReferral(e.target.checked)} />
                        I can offer a referral for my current organization
                    </label>

                    <input className="input" placeholder="Skills (comma separated)" value={skills} onChange={e => setSkills(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" type="number" placeholder="Experience (Years)" value={experience} onChange={e => setExperience(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" type="number" placeholder="Expected Salary (e.g. 150000)" value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} style={{ marginBottom: '10px' }} />
                    
                    <textarea className="input" placeholder="AI Match Profile (Tell us your ideal work culture, dream role, etc.)" value={bio} onChange={e => setBio(e.target.value)} style={{ marginBottom: '10px', minHeight: '80px' }} />

                    {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                    <button className="btn btn-primary btn-lg" onClick={handleRegisterCandidate} disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Matching...' : 'Join as Candidate'}
                    </button>
                </div>
            </div>
        )
    }

    if (mode === 'register_organization') {
        return (
            <div className="landing">
                <div className="animated-bg" />
                <div className="landing-card" style={{ maxWidth: 400 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMode('choose')} style={{ marginBottom: '16px' }}>← Back</button>
                    <h2>Organization Registration</h2>
                    
                    <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px' }} />
                    <input className="input" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ marginBottom: '10px' }} />

                    {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                    <button className="btn btn-primary btn-lg" onClick={handleRegisterOrg} disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Registering...' : 'Join as Organization'}
                    </button>
                </div>
            </div>
        )
    }

    return null;
}
