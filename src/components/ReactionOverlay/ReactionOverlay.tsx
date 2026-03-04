import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import type { Reaction } from '../../store/useStore'

export default function ReactionOverlay() {
    const reactions = useStore((s) => s.reactions)
    const currentRoomId = useStore((s) => s.currentRoomId)

    // Memoize the filter to avoid new array reference every render
    const visible = useMemo(
        () => reactions.filter((r) => r.room_id === currentRoomId),
        [reactions, currentRoomId]
    )

    return (
        <div className="reaction-overlay">
            {visible.map((reaction) => (
                <ReactionParticle key={reaction.id} reaction={reaction} />
            ))}
        </div>
    )
}

function ReactionParticle({ reaction }: { reaction: Reaction }) {
    const sizeMap = { sm: '1.8rem', md: '2.5rem', lg: '3.5rem' }
    const size = sizeMap[reaction.size as keyof typeof sizeMap] || '2.5rem'

    const content = reaction.type === 'gif' ? (
        <img
            src={reaction.content}
            alt="gif reaction"
            style={{
                width: '120px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
        />
    ) : (
        <span style={{ fontSize: size }}>{reaction.content}</span>
    )

    return (
        <div
            className={`reaction-particle ${reaction.animation}`}
            style={{
                left: `${reaction.x}%`,
                top: `${reaction.y}%`,
                animationDuration: reaction.type === 'gif' ? '4s' : '3s',
            }}
            title={`${reaction.username} reacted`}
        >
            {content}
            {/* Username label */}
            <div style={{
                position: 'absolute',
                bottom: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)',
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.5)',
                padding: '1px 6px',
                borderRadius: '999px',
                pointerEvents: 'none',
            }}>
                {reaction.username}
            </div>
        </div>
    )
}
