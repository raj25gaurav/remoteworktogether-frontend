import { useMemo } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import type { Reaction } from '../../store/useStore'
import { MESSAGE_TYPE } from '../../types/enums'

export default function ReactionOverlay() {
    const reactions = useStore((s: AppState) => s.reactions)
    const currentRoomId = useStore((s: AppState) => s.currentRoomId)

    // Memoize the filter to avoid new array reference every render
    const roomReactions = useMemo(
        () => reactions.filter((r) => r.room_id === currentRoomId),
        [reactions, currentRoomId]
    )

    if (roomReactions.length === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col-reverse gap-2 max-w-xs pointer-events-none">
            {roomReactions.map((reaction) => (
                <ReactionCard key={reaction.id} reaction={reaction} />
            ))}
        </div>
    )
}

function ReactionCard({ reaction }: { reaction: Reaction }) {
    const content = reaction.type === MESSAGE_TYPE.GIF ? (
        <img
            src={reaction.content}
            alt="gif reaction"
            className="w-16 h-16 object-cover rounded-lg"
        />
    ) : (
        <span className="text-2xl">{reaction.content}</span>
    )

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 animate-[slide-in-right_0.3s_ease] flex items-center gap-3 pointer-events-auto backdrop-blur-sm">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg">
                {content}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {reaction.username}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    reacted
                </div>
            </div>
        </div>
    )
}
