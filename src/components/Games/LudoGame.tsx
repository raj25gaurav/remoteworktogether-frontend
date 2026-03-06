import React, { useState, useCallback } from 'react'

// ── Simple 2-player Ludo (Red vs Blue) ───────────────────────────────────
// Track tokens 0-3 for each player. Position -1 = home, 0-56 = on board, 57 = finished.
// Board path has 52 cells (standard Ludo) — we use a simplified 40-cell path for display.

const COLORS = {
    red: { bg: '#ef4444', label: '🔴 Red', light: '#fca5a5', home: '#fee2e2' },
    blue: { bg: '#3b82f6', label: '🔵 Blue', light: '#93c5fd', home: '#dbeafe' },
}
type Color = keyof typeof COLORS
const PLAYERS: Color[] = ['red', 'blue']
const WINNING_POS = 56

type Token = { pos: number } // -1 = base, 0-55 = track, 56 = finished
type GameState = Record<Color, Token[]>

function initTokens(): GameState {
    return {
        red: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }],
        blue: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }],
    }
}

function rollDice(): number { return Math.floor(Math.random() * 6) + 1 }

function canMove(tokens: Token[], dice: number): boolean {
    return tokens.some(t => {
        if (t.pos === -1) return dice === 6
        if (t.pos === WINNING_POS) return false
        return t.pos + dice <= WINNING_POS
    })
}

export default function LudoGame({ onClose }: { onClose: () => void }) {
    const [tokens, setTokens] = useState<GameState>(initTokens)
    const [turn, setTurn] = useState<Color>('red')
    const [dice, setDice] = useState<number | null>(null)
    const [rolling, setRolling] = useState(false)
    const [message, setMessage] = useState('Red rolls first! 🎲')
    const [winner, setWinner] = useState<Color | null>(null)
    const [rolled, setRolled] = useState(false)

    const handleRoll = useCallback(() => {
        if (rolling || rolled) return
        setRolling(true)
        // Quick animation effect
        let count = 0
        const anim = setInterval(() => {
            setDice(rollDice())
            count++
            if (count >= 8) {
                clearInterval(anim)
                const final = rollDice()
                setDice(final)
                setRolling(false)
                setRolled(true)

                const myToks = tokens[turn]
                if (!canMove(myToks, final)) {
                    setMessage(`${COLORS[turn].label}: Rolled ${final} — No moves! Passing turn.`)
                    setTimeout(() => {
                        const next = turn === 'red' ? 'blue' : 'red'
                        setTurn(next)
                        setRolled(false)
                        setDice(null)
                        setMessage(`${COLORS[next].label}'s turn! 🎲`)
                    }, 1500)
                } else {
                    setMessage(`${COLORS[turn].label}: Rolled ${final}! Pick a token to move.`)
                }
            }
        }, 80)
    }, [rolling, rolled, tokens, turn])

    const handleTokenClick = useCallback((color: Color, idx: number) => {
        if (color !== turn || !rolled || dice === null || winner) return
        const tok = tokens[color][idx]

        // From base: need dice = 6 to enter track
        if (tok.pos === -1 && dice !== 6) { setMessage('Need a 6 to enter the track!'); return }
        if (tok.pos === WINNING_POS) { setMessage('This token already finished!'); return }
        const newPos = tok.pos === -1 ? 0 : Math.min(tok.pos + dice, WINNING_POS)

        const newTokens: GameState = {
            ...tokens,
            [color]: tokens[color].map((t, i) => i === idx ? { pos: newPos } : t),
        }
        setTokens(newTokens)

        // Check win
        if (newTokens[color].every(t => t.pos === WINNING_POS)) {
            setWinner(color)
            setMessage(`🏆 ${COLORS[color].label} wins! Congratulations!`)
            return
        }

        // Pass turn (6 = extra turn)
        if (dice === 6) {
            setRolled(false); setDice(null)
            setMessage(`${COLORS[turn].label} rolled a 6! Roll again! 🎉`)
        } else {
            const next = turn === 'red' ? 'blue' : 'red'
            setTurn(next); setRolled(false); setDice(null)
            setMessage(`${COLORS[next].label}'s turn! 🎲`)
        }
    }, [turn, rolled, dice, tokens, winner])

    const reset = () => {
        setTokens(initTokens()); setTurn('red'); setDice(null)
        setRolling(false); setRolled(false); setWinner(null)
        setMessage('Red rolls first! 🎲')
    }

    const diceFace = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

    const posLabel = (pos: number) => pos === -1 ? 'Base' : pos === WINNING_POS ? '🏆 Done!' : `Track ${pos + 1}`

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>🎲 Ludo</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={reset} style={{ fontSize: '11px' }}>↩ Reset</button>
                    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '11px' }}>✕</button>
                </div>
            </div>

            {/* Message */}
            <div style={{
                padding: '8px 14px', borderRadius: 10, fontSize: '12px', fontWeight: 600,
                background: `${COLORS[turn].bg}20`, border: `1px solid ${COLORS[turn].bg}40`,
                color: 'var(--text-primary)', textAlign: 'center',
            }}>
                {message}
            </div>

            {/* Dice + Roll */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <div style={{
                    fontSize: '3rem', lineHeight: 1, userSelect: 'none',
                    animation: rolling ? 'avatar-idle 0.15s infinite' : 'none',
                }}>
                    {dice ? diceFace[dice] : '🎲'}
                </div>
                <button
                    className={`btn btn-primary`}
                    style={{ fontSize: '14px', padding: '10px 24px', background: rolled ? 'var(--bg-card)' : `${COLORS[turn].bg}`, border: 'none' }}
                    onClick={handleRoll}
                    disabled={rolling || rolled || !!winner}
                >
                    {rolling ? 'Rolling...' : rolled ? 'Pick Token ↑' : '🎲 Roll'}
                </button>
            </div>

            {/* Tokens */}
            {PLAYERS.map(color => (
                <div key={color} style={{
                    padding: '12px', borderRadius: 12,
                    background: `${COLORS[color].bg}10`,
                    border: `1px solid ${COLORS[color].bg}${turn === color ? '60' : '20'}`,
                    transition: 'border-color 0.2s',
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS[color].bg, marginBottom: '10px' }}>
                        {COLORS[color].label} {turn === color && !winner ? '← Your Turn' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {tokens[color].map((tok, i) => (
                            <div
                                key={i}
                                onClick={() => handleTokenClick(color, i)}
                                style={{
                                    width: 64, padding: '8px 4px', borderRadius: 10,
                                    background: tok.pos === WINNING_POS ? '#10b98130' : COLORS[color].home,
                                    border: `2px solid ${turn === color && rolled && tok.pos !== WINNING_POS && (tok.pos !== -1 || dice === 6) ? COLORS[color].bg : 'transparent'}`,
                                    cursor: turn === color && rolled && !winner ? 'pointer' : 'default',
                                    textAlign: 'center', transition: 'all 0.15s',
                                    transform: turn === color && rolled && tok.pos !== WINNING_POS && (tok.pos !== -1 || dice === 6) ? 'translateY(-2px)' : 'none',
                                    boxShadow: turn === color && rolled && tok.pos !== WINNING_POS && (tok.pos !== -1 || dice === 6) ? `0 4px 12px ${COLORS[color].bg}60` : 'none',
                                }}
                            >
                                <div style={{ fontSize: '1.4rem' }}>{tok.pos === WINNING_POS ? '🏆' : tok.pos === -1 ? '⭕' : '🔵'}</div>
                                <div style={{ fontSize: '9px', color: COLORS[color].bg, fontWeight: 700, marginTop: '2px' }}>
                                    {posLabel(tok.pos)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Progress bar */}
            {PLAYERS.map(color => {
                const done = tokens[color].filter(t => t.pos === WINNING_POS).length
                return (
                    <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: COLORS[color].bg, fontWeight: 700, minWidth: 36 }}>{COLORS[color].label.split(' ')[1]}</div>
                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-card)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(done / 4) * 100}%`, background: COLORS[color].bg, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{done}/4</div>
                    </div>
                )
            })}
        </div>
    )
}
