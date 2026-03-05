import React, { useState, useEffect, useRef } from 'react'

// ── Daily motivational quotes — changes every day ─────────────────────────
const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Work hard in silence, let success be your noise.", author: "Frank Ocean" },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
    { text: "A meeting is an event where people talk about things they should do while doing nothing.", author: "Office Wisdom" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "If you think you are too small to make a difference, try sleeping with a mosquito.", author: "Dalai Lama" },
    { text: "Eat a live frog every morning and nothing worse will happen to you the rest of the day.", author: "Mark Twain" },
    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
]

// ── Office ticker messages that scroll across the top ─────────────────────
const TICKER_MSGS = [
    "☕ Coffee machine is restocked — today's mood: Espresso",
    "📢 All-hands meeting postponed indefinitely (as expected)",
    "🎉 Sarah just hit 100 messages — Employee of the Hour!",
    "💡 Pro tip: Turning it off and on again solves 80% of problems",
    "📊 Q1 Vibes Report: Team morale UP 42% since adding virtual office",
    "🏆 \"Bug-free code\" spotted in the wild — scientists baffled",
    "📅 Reminder: Stand-up in 5 mins! Or continue sitting, we don't judge",
    "🎵 Current office vibe: Deep Focus Mode ON",
    "☀️ Work-from-home forecast: 100% chance of staying in pajamas",
    "💪 Shipping is just complaining in production. Stay bold.",
]

// ── Office Ticker ─────────────────────────────────────────────────────────
export function OfficeTicker() {
    // Duplicate messages for seamless loop
    const msgs = [...TICKER_MSGS, ...TICKER_MSGS]
    return (
        <div className="office-ticker">
            <div className="ticker-label">
                <span>📢</span> LIVE
            </div>
            <div className="ticker-scroll">
                <div className="ticker-inner">
                    {msgs.map((msg, i) => (
                        <span key={i} className="ticker-item">{msg}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Pomodoro Focus Timer ──────────────────────────────────────────────────
const WORK_MINS = 25
const BREAK_MINS = 5

export function PomodoroWidget() {
    const [isWork, setIsWork] = useState(true)
    const [running, setRunning] = useState(false)
    const [secsLeft, setSecsLeft] = useState(WORK_MINS * 60)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const total = (isWork ? WORK_MINS : BREAK_MINS) * 60
    const pct = Math.round(((total - secsLeft) / total) * 100)
    const mins = String(Math.floor(secsLeft / 60)).padStart(2, '0')
    const secs = String(secsLeft % 60).padStart(2, '0')

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSecsLeft(s => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!)
                        setRunning(false)
                        // Switch mode
                        setIsWork(w => !w)
                        setSecsLeft(isWork ? BREAK_MINS * 60 : WORK_MINS * 60)
                        return 0
                    }
                    return s - 1
                })
            }, 1000)
        } else {
            clearInterval(intervalRef.current!)
        }
        return () => clearInterval(intervalRef.current!)
    }, [running])

    const reset = () => {
        setRunning(false)
        setIsWork(true)
        setSecsLeft(WORK_MINS * 60)
    }

    return (
        <div className="pomodoro-widget" onClick={() => setRunning(r => !r)} title={running ? 'Click to Pause' : 'Click to Start Focus Timer'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Ring */}
                <div
                    className={`pomodoro-ring ${isWork ? 'pomodoro-ring-work' : 'pomodoro-ring-break'}`}
                    style={{ '--pct': `${pct}%` } as React.CSSProperties}
                >
                    <div className="pomodoro-ring-inner">{mins}:{secs}</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isWork ? 'var(--accent)' : 'var(--emerald)', letterSpacing: '0.5px' }}>
                        {isWork ? '🔥 DEEP WORK' : '☕ BREAK TIME'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {running ? 'Click to pause' : 'Click to start'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={(e) => { e.stopPropagation(); reset() }}>
                            ↩ Reset
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Daily Office Quote ────────────────────────────────────────────────────
export function DailyQuote() {
    // Pick a quote based on the day of year so it changes daily
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const quote = QUOTES[dayOfYear % QUOTES.length]

    return (
        <div className="daily-quote">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                💡 Quote of the Day
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', paddingLeft: '4px' }}>
                "{quote.text}"
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                — {quote.author}
            </div>
        </div>
    )
}

// ── Office Vibe selector ──────────────────────────────────────────────────
const VIBES = [
    { id: 'productive', label: '⚡ Productive', cls: 'vibe-productive' },
    { id: 'deep-work', label: '🔵 Deep Work', cls: 'vibe-deep-work' },
    { id: 'chill', label: '🌊 Chill Mode', cls: 'vibe-chill' },
    { id: 'standup', label: '📣 On a Call', cls: 'vibe-standup' },
]

export function OfficeVibe() {
    const [vibe, setVibe] = useState('productive')
    const current = VIBES.find(v => v.id === vibe)!
    const [open, setOpen] = useState(false)

    return (
        <div style={{ position: 'relative' }}>
            <div
                className={`vibe-chip ${current.cls}`}
                onClick={() => setOpen(o => !o)}
                style={{ cursor: 'pointer' }}
                title="Set your current office vibe"
            >
                {current.label} ▾
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    zIndex: 100,
                    minWidth: 150,
                    boxShadow: 'var(--shadow-md)',
                }}>
                    {VIBES.map(v => (
                        <div
                            key={v.id}
                            onClick={() => { setVibe(v.id); setOpen(false) }}
                            style={{
                                padding: '9px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: vibe === v.id ? 'var(--accent)' : 'var(--text-secondary)',
                                background: vibe === v.id ? 'rgba(245,158,11,0.07)' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = vibe === v.id ? 'rgba(245,158,11,0.07)' : 'transparent')}
                        >
                            {v.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Productivity Score meter ──────────────────────────────────────────────
export function ProductivityMeter({ score }: { score: number }) {
    const label = score >= 80 ? '🚀 On Fire!' : score >= 60 ? '⚡ Crushing It' : score >= 40 ? '💪 Getting There' : '☕ Warming Up'
    const color = score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--accent)' : score >= 40 ? 'var(--blue)' : 'var(--text-muted)'

    return (
        <div className="productivity-meter">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Office Score
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color, marginTop: '2px' }}>
                        {label}
                    </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color }}>
                    {score}<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</span>
                </div>
            </div>
            <div className="meter-bar-track">
                <div className="meter-bar-fill" style={{ width: `${score}%` }} />
            </div>
        </div>
    )
}
