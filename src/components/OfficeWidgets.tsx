import React, { useState, useEffect, useRef } from 'react'

// ── Daily motivational quotes — changes every day ─────────────────────────
const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Work hard in silence, let success be your noise.", author: "Frank Ocean" },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
    { text: "A meeting is an event where people talk about things they should do while doing nothing.", author: "Office Wisdom" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
]

// ── Work Tips by domain ───────────────────────────────────────────────────
const WORK_TIPS: { domain: string; icon: string; color: string; tips: string[] }[] = [
    {
        domain: 'SDE', icon: '💻', color: '#6366f1',
        tips: [
            'Write code for the next developer, not just the machine.',
            'A failing test is better than a missing test.',
            'Prefer composition over inheritance.',
            'Name variables by what they mean, not what they are.',
            'Commit small, push often — easier to review & revert.',
            'The fastest code is the code that doesn\'t run.',
            'Debug by adding assertions, not just print statements.',
        ]
    },
    {
        domain: 'Gen AI', icon: '🤖', color: '#8b5cf6',
        tips: [
            'Chain-of-thought prompting improves reasoning accuracy significantly.',
            'RAG (Retrieval-Augmented Generation) beats fine-tuning for fresh data.',
            'Always measure your LLM latency — stream when possible.',
            'Use temperature 0 for deterministic outputs in prod.',
            'Embeddings near in vector space are semantically related.',
            'System prompts are more powerful than user prompts for tone control.',
            'Few-shot examples in prompts beat long instructions.',
        ]
    },
    {
        domain: 'Data', icon: '📊', color: '#f59e0b',
        tips: [
            'Plot your data before modeling — surprises live in distributions.',
            'Feature engineering beats algorithm selection 80% of the time.',
            'Validation leakage is the #1 silent killer of ML projects.',
            'Use median over mean for skewed distributions.',
            'Always version your datasets like you version your code.',
            'A confusion matrix tells a richer story than accuracy alone.',
            'Data quality > model complexity. Always.',
        ]
    },
    {
        domain: 'Product', icon: '🎯', color: '#10b981',
        tips: [
            'Ship to 5% of users before shipping to 100%.',
            'Talk to users before building. Then again after.',
            'P0 bugs are the ones the CEO reports on Monday morning.',
            'A good spec prevents 10 rounds of code review.',
            'Kill features that don\'t move the needle. Be ruthless.',
            'Net Promoter Score is a lagging indicator. Watch retention.',
            'Velocity without direction is just noise.',
        ]
    },
    {
        domain: 'DevOps', icon: '⚙️', color: '#06b6d4',
        tips: [
            'Infrastructure as Code prevents "works on my machine".',
            'Monitor latency percentiles (p95, p99) not just averages.',
            'A rollback plan is as important as the deployment plan.',
            'Canary releases: ship to 1% first, check metrics, then proceed.',
            'Set alerts on error rates, not just uptime.',
            'Immutable infrastructure beats mutation-in-place.',
            'On-call without runbooks is just chaos with a pager.',
        ]
    },
]

// ── Work Tips Ticker (replaces OfficeTicker) ──────────────────────────────
export function WorkTipsTicker() {
    const [domainIdx, setDomainIdx] = useState(0)
    const [tipIdx, setTipIdx] = useState(0)
    const [fade, setFade] = useState(true)

    const domain = WORK_TIPS[domainIdx]
    const tip = domain.tips[tipIdx]

    useEffect(() => {
        const id = setInterval(() => {
            setFade(false)
            setTimeout(() => {
                setTipIdx(t => {
                    const next = (t + 1) % domain.tips.length
                    if (next === 0) setDomainIdx(d => (d + 1) % WORK_TIPS.length)
                    return next
                })
                setFade(true)
            }, 350)
        }, 8000)
        return () => clearInterval(id)
    }, [domain])

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 14px',
            background: `${domain.color}10`,
            borderBottom: `1px solid ${domain.color}22`,
            fontSize: '12px',
            minHeight: 34,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                padding: '2px 8px', borderRadius: 99,
                background: `${domain.color}20`, border: `1px solid ${domain.color}40`,
                color: domain.color, fontWeight: 700, fontSize: '11px',
            }}>
                {domain.icon} {domain.domain}
            </div>
            <div style={{
                color: 'var(--text-secondary)', flex: 1, overflow: 'hidden',
                whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                opacity: fade ? 1 : 0, transition: 'opacity 0.35s ease',
            }}>
                💡 {tip}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {WORK_TIPS.map((d, i) => (
                    <div key={i} onClick={() => { setDomainIdx(i); setTipIdx(0) }}
                        title={d.domain}
                        style={{
                            width: 6, height: 6, borderRadius: '50%', cursor: 'pointer',
                            background: i === domainIdx ? domain.color : 'var(--border-strong)',
                            transition: 'background 0.2s',
                        }} />
                ))}
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
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
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

// ── Office Vibe selector — with external state so App can show it ─────────
const VIBES = [
    { id: 'productive', label: '⚡ Productive', cls: 'vibe-productive' },
    { id: 'deep-work', label: '🔵 Deep Work', cls: 'vibe-deep-work' },
    { id: 'chill', label: '🌊 Chill Mode', cls: 'vibe-chill' },
    { id: 'standup', label: '📣 On a Call', cls: 'vibe-standup' },
    { id: 'brb', label: '🍵 BRB', cls: 'vibe-chill' },
    { id: 'reviewing', label: '🔍 Reviewing', cls: 'vibe-deep-work' },
]

interface OfficeVibeProps {
    vibe: string
    onChange: (v: string) => void
}

export function OfficeVibe({ vibe, onChange }: OfficeVibeProps) {
    const current = VIBES.find(v => v.id === vibe) ?? VIBES[0]
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
                    position: 'absolute', top: '110%', left: 0,
                    background: 'var(--bg-panel)', border: '1px solid var(--border-strong)',
                    borderRadius: 12, overflow: 'hidden', zIndex: 200,
                    minWidth: 160, boxShadow: 'var(--shadow-md)',
                }}>
                    {VIBES.map(v => (
                        <div
                            key={v.id}
                            onClick={() => { onChange(v.id); setOpen(false) }}
                            style={{
                                padding: '9px 14px', fontSize: '12px', fontWeight: 600,
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

// ── Productivity Score meter (score derived externally) ────────────────────
export function ProductivityMeter({ score }: { score: number }) {
    const clamped = Math.min(100, Math.max(0, Math.round(score)))
    const label = clamped >= 80 ? '🚀 On Fire!' : clamped >= 60 ? '⚡ Crushing It' : clamped >= 40 ? '💪 Getting There' : '☕ Warming Up'
    const color = clamped >= 80 ? 'var(--emerald)' : clamped >= 60 ? 'var(--accent)' : clamped >= 40 ? 'var(--blue)' : 'var(--text-muted)'

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
                    {clamped}<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</span>
                </div>
            </div>
            <div className="meter-bar-track">
                <div className="meter-bar-fill" style={{ width: `${clamped}%`, transition: 'width 0.5s ease' }} />
            </div>
        </div>
    )
}
