import React, { useState } from 'react'
import ChessGame from './ChessGame'
import LudoGame from './LudoGame'

type GameId = 'chess' | 'ludo' | null

const GAMES = [
    { id: 'chess' as GameId, label: 'Chess', icon: '♟️', desc: '2-player classic strategy' },
    { id: 'ludo' as GameId, label: 'Ludo', icon: '🎲', desc: 'Roll dice, race to finish' },
]

interface CabinGamesProps {
    enabled: boolean
    onToggle: () => void
}

export default function CabinGames({ enabled, onToggle }: CabinGamesProps) {
    const [activeGame, setActiveGame] = useState<GameId>(null)

    if (!enabled) return null


    return (
        <div style={{
            width: 320, flexShrink: 0,
            borderLeft: '1px solid rgba(245,158,11,0.12)',
            background: 'rgba(8,12,22,0.9)',
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>🎮 Game Room</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {activeGame && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setActiveGame(null)} style={{ fontSize: '11px' }}>
                            ← Games
                        </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ fontSize: '11px' }}>✕</button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {!activeGame ? (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                            🕹️ Play a game with your cabin colleagues!
                        </div>
                        {GAMES.map(g => (
                            <div
                                key={g.id!}
                                onClick={() => setActiveGame(g.id)}
                                style={{
                                    padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                                        ; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                                        ; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'
                                        ; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                                        ; (e.currentTarget as HTMLElement).style.transform = 'none'
                                }}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem', background: 'rgba(245,158,11,0.08)',
                                    border: '1px solid rgba(245,158,11,0.15)', flexShrink: 0,
                                }}>
                                    {g.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{g.label}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.desc}</div>
                                </div>
                                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '16px' }}>›</div>
                            </div>
                        ))}

                        <div style={{
                            marginTop: '8px', padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)',
                            fontSize: '11px', color: 'var(--text-muted)',
                        }}>
                            💡 All cabin members can open the same game independently. Future update: real-time multiplayer!
                        </div>
                    </div>
                ) : activeGame === 'chess' ? (
                    <ChessGame onClose={() => setActiveGame(null)} />
                ) : (
                    <LudoGame onClose={() => setActiveGame(null)} />
                )}
            </div>
        </div>
    )
}
