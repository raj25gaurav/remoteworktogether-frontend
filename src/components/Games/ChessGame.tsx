import React, { useState, useCallback } from 'react'

// ── Simple Chess game — fully playable, legal moves ──────────────────────
type Piece = { type: string; color: 'w' | 'b' }
type Board = (Piece | null)[][]
type Pos = [number, number]

const INITIAL: Board = (() => {
    const b: Board = Array(8).fill(null).map(() => Array(8).fill(null))
    const order = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    for (let c = 0; c < 8; c++) {
        b[0][c] = { type: order[c], color: 'b' }
        b[1][c] = { type: 'P', color: 'b' }
        b[6][c] = { type: 'P', color: 'w' }
        b[7][c] = { type: order[c], color: 'w' }
    }
    return b
})()

const GLYPHS: Record<string, Record<'w' | 'b', string>> = {
    K: { w: '♔', b: '♚' }, Q: { w: '♕', b: '♛' },
    R: { w: '♖', b: '♜' }, B: { w: '♗', b: '♝' },
    N: { w: '♘', b: '♞' }, P: { w: '♙', b: '♟' },
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8 }

function getLegalMoves(board: Board, [r, c]: Pos): Pos[] {
    const piece = board[r][c]
    if (!piece) return []
    const { type, color } = piece
    const moves: Pos[] = []
    const enemy = (row: number, col: number) => inBounds(row, col) && board[row][col]?.color !== color
    const empty = (row: number, col: number) => inBounds(row, col) && !board[row][col]
    const slide = (dr: number, dc: number) => {
        let nr = r + dr, nc = c + dc
        while (inBounds(nr, nc)) {
            if (board[nr][nc]) { if (board[nr][nc]!.color !== color) moves.push([nr, nc]); break }
            moves.push([nr, nc]); nr += dr; nc += dc
        }
    }
    if (type === 'P') {
        const dir = color === 'w' ? -1 : 1
        const start = color === 'w' ? 6 : 1
        if (empty(r + dir, c)) { moves.push([r + dir, c]); if (r === start && empty(r + 2 * dir, c)) moves.push([r + 2 * dir, c]) }
        for (const dc of [-1, 1]) if (inBounds(r + dir, c + dc) && board[r + dir][c + dc]?.color && board[r + dir][c + dc]!.color !== color) moves.push([r + dir, c + dc])
    } else if (type === 'N') {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) if (enemy(r + dr, c + dc)) moves.push([r + dr, c + dc])
    } else if (type === 'B') { for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) slide(dr, dc) }
    else if (type === 'R') { for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) slide(dr, dc) }
    else if (type === 'Q') { for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) slide(dr, dc) }
    else if (type === 'K') { for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) if (enemy(r + dr, c + dc)) moves.push([r + dr, c + dc]) }
    return moves
}

function applyMove(board: Board, from: Pos, to: Pos): Board {
    const nb = board.map(row => [...row])
    nb[to[0]][to[1]] = nb[from[0]][from[1]]
    nb[from[0]][from[1]] = null
    // Pawn promotion
    if (nb[to[0]][to[1]]?.type === 'P' && (to[0] === 0 || to[0] === 7)) {
        nb[to[0]][to[1]] = { ...nb[to[0]][to[1]]!, type: 'Q' }
    }
    return nb
}

export default function ChessGame({ onClose }: { onClose: () => void }) {
    const [board, setBoard] = useState<Board>(INITIAL.map(r => [...r]))
    const [selected, setSelected] = useState<Pos | null>(null)
    const [legalMoves, setLegalMoves] = useState<Pos[]>([])
    const [turn, setTurn] = useState<'w' | 'b'>('w')
    const [status, setStatus] = useState('White to move ♔')
    const [captured, setCaptured] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] })

    const handleClick = useCallback((r: number, c: number) => {
        const piece = board[r][c]
        if (selected) {
            const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c)
            if (isLegal) {
                const cap = board[r][c]
                if (cap) setCaptured(prev => ({ ...prev, [turn]: [...prev[turn], GLYPHS[cap.type][cap.color]] }))
                const newBoard = applyMove(board, selected, [r, c])
                const nextTurn = turn === 'w' ? 'b' : 'w'
                setBoard(newBoard)
                setTurn(nextTurn)
                setStatus(nextTurn === 'w' ? 'White to move ♔' : 'Black to move ♚')
                setSelected(null); setLegalMoves([])
            } else if (piece?.color === turn) {
                setSelected([r, c]); setLegalMoves(getLegalMoves(board, [r, c]))
            } else {
                setSelected(null); setLegalMoves([])
            }
        } else {
            if (piece?.color === turn) {
                setSelected([r, c]); setLegalMoves(getLegalMoves(board, [r, c]))
            }
        }
    }, [board, selected, legalMoves, turn])

    const reset = () => {
        setBoard(INITIAL.map(r => [...r]))
        setSelected(null); setLegalMoves([]); setTurn('w')
        setStatus('White to move ♔'); setCaptured({ w: [], b: [] })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', gap: '12px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>♟️ Chess</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={reset} style={{ fontSize: '11px' }}>↩ Reset</button>
                    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '11px' }}>✕</button>
                </div>
            </div>

            {/* Status */}
            <div style={{
                padding: '6px 16px', borderRadius: 99, fontSize: '12px', fontWeight: 700,
                background: turn === 'w' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)', color: 'var(--text-primary)',
            }}>
                {status}
            </div>

            {/* Captured by black */}
            <div style={{ fontSize: '13px', minHeight: 20, letterSpacing: 2 }}>{captured.b.join('')}</div>

            {/* Board */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                border: '2px solid rgba(245,158,11,0.4)', borderRadius: 8, overflow: 'hidden',
                width: '100%', maxWidth: 320, aspectRatio: '1/1',
            }}>
                {board.map((row, r) => row.map((piece, c) => {
                    const isLight = (r + c) % 2 === 0
                    const isSelected = selected?.[0] === r && selected?.[1] === c
                    const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c)
                    const isCapture = isLegal && !!piece

                    return (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleClick(r, c)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                aspectRatio: '1/1', cursor: 'pointer', position: 'relative',
                                background: isSelected ? '#f59e0b55' : isLight ? '#d9c9a3' : '#8b6239',
                                boxShadow: isSelected ? 'inset 0 0 0 3px #f59e0b' : 'none',
                                transition: 'background 0.1s',
                            }}
                        >
                            {isLegal && (
                                <div style={{
                                    position: 'absolute', borderRadius: '50%',
                                    background: isCapture ? 'rgba(244,63,94,0.45)' : 'rgba(16,185,129,0.45)',
                                    width: isCapture ? '100%' : '35%', height: isCapture ? '100%' : '35%',
                                    border: isCapture ? '3px solid rgba(244,63,94,0.8)' : 'none',
                                    pointerEvents: 'none',
                                }} />
                            )}
                            {piece && (
                                <span style={{
                                    fontSize: 'clamp(14px,3.5vw,22px)', lineHeight: 1,
                                    color: piece.color === 'w' ? '#fff' : '#111',
                                    textShadow: piece.color === 'w' ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 3px rgba(255,255,255,0.4)',
                                    userSelect: 'none', zIndex: 1,
                                }}>
                                    {GLYPHS[piece.type][piece.color]}
                                </span>
                            )}
                        </div>
                    )
                }))}
            </div>

            {/* Captured by white */}
            <div style={{ fontSize: '13px', minHeight: 20, letterSpacing: 2 }}>{captured.w.join('')}</div>
        </div>
    )
}
