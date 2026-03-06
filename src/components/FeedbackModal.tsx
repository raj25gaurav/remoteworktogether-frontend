import React, { useState } from 'react'
import { API_URL } from '../utils/constants'

interface FeedbackModalProps {
    duration: string
    userId: string | null
    onConfirm: () => void
    onCancel: () => void
}

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
    return (
        <span
            onClick={onClick}
            style={{
                fontSize: '2rem',
                cursor: 'pointer',
                color: filled ? '#f59e0b' : 'var(--border-strong)',
                transition: 'transform 0.15s, color 0.15s',
                display: 'inline-block',
                userSelect: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
            ★
        </span>
    )
}

const QUICK_LIKED = ['🎥 Video calls', '💬 Office chat', '⏱️ Session timer', '🔥 Pomodoro focus', '🎉 Reactions', '🤖 AI colleague', '🏢 Office vibe']
const QUICK_IMPROVE = ['More features', 'Faster video', 'Better UI', 'Mobile app', 'Calendar sync', 'Custom avatars']

export default function FeedbackModal({ duration, userId, onConfirm, onCancel }: FeedbackModalProps) {
    const [rating, setRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [liked, setLiked] = useState('')
    const [improve, setImprove] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [quickLiked, setQuickLiked] = useState<string[]>([])
    const [quickImprove, setQuickImprove] = useState<string[]>([])

    const toggleQuick = (arr: string[], setArr: (v: string[]) => void, val: string) => {
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
    }

    const handleSubmit = async () => {
        if (rating === 0) return
        setSubmitting(true)
        const likedFull = [liked, ...quickLiked].filter(Boolean).join(', ')
        const improveFull = [improve, ...quickImprove].filter(Boolean).join(', ')
        try {
            await fetch(`${API_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    rating,
                    liked: likedFull,
                    improve: improveFull,
                }),
            })
        } catch { /* non-blocking */ }
        setSubmitted(true)
        setSubmitting(false)
        setTimeout(onConfirm, 1800)
    }

    const starLabel = ['', '😔 Not great', '😐 Okay', '🙂 Decent', '😊 Good', '🤩 Amazing!'][rating] || ''

    return (
        <div className="modal-overlay" onClick={undefined}>
            <div className="modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                {submitted ? (
                    <>
                        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🙌</div>
                        <h3 className="modal-title">Thanks for the feedback!</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>See you tomorrow 👋 Have a great rest of the day!</p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>🏁</div>
                        <h3 className="modal-title" style={{ marginBottom: '4px' }}>Clock Out?</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Great session! Quick feedback before you go?</p>

                        {/* Session summary */}
                        <div style={{
                            padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '12px', marginBottom: '20px',
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>⏱️ Time at Desk</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#10b981' }}>{duration}</div>
                        </div>

                        {/* Star rating */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>How was today's session?</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span
                                        key={i}
                                        onClick={() => setRating(i)}
                                        onMouseEnter={() => setHoveredStar(i)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                        style={{
                                            fontSize: '2.2rem', cursor: 'pointer', userSelect: 'none',
                                            color: i <= (hoveredStar || rating) ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                                            transition: 'transform 0.1s, color 0.1s',
                                            transform: i <= (hoveredStar || rating) ? 'scale(1.2)' : 'scale(1)',
                                            display: 'inline-block',
                                        }}
                                    >★</span>
                                ))}
                            </div>
                            {rating > 0 && (
                                <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, marginTop: '6px' }}>{starLabel}</div>
                            )}
                        </div>

                        {/* Quick picks */}
                        {rating > 0 && (
                            <>
                                <div style={{ textAlign: 'left', marginTop: '16px', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>What did you like? (optional)</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {QUICK_LIKED.map(q => (
                                            <button key={q} onClick={() => toggleQuick(quickLiked, setQuickLiked, q)}
                                                className={`btn btn-sm ${quickLiked.includes(q) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: '11px', padding: '4px 10px' }}
                                            >{q}</button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>What should we improve?</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {QUICK_IMPROVE.map(q => (
                                            <button key={q} onClick={() => toggleQuick(quickImprove, setQuickImprove, q)}
                                                className={`btn btn-sm ${quickImprove.includes(q) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: '11px', padding: '4px 10px' }}
                                            >{q}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>😅 Stay a Bit</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2, background: rating > 0 ? 'linear-gradient(135deg,#f43f5e,#e11d48)' : undefined, border: 'none', opacity: submitting ? 0.7 : 1 }}
                                onClick={rating > 0 ? handleSubmit : onConfirm}
                                disabled={submitting}
                            >
                                {submitting ? '...' : rating > 0 ? '🔴 Submit & Clock Out' : '🔴 Clock Out'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
