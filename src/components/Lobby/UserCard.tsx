import { useStore, type AppState } from '../../store/useStore'
import type { User } from '../../store/useStore'
import { AVATAR_MAP } from '../../utils/constants'
import { USER_STATUS_CONFIG } from '../../types/enums'

interface UserCardProps {
    user: User
    onInvite?: (userId: string) => void
    compact?: boolean
}

const STATUS_COLORS: Record<string, string> = {
    online: '#10b981',
    busy: '#f59e0b',
    away: '#94a3b8',
    focus: '#8b5cf6',
}

function StatusDot({ status }: { status: string }) {
    const color = STATUS_COLORS[status] || '#94a3b8'
    return (
        <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800"
            style={{ backgroundColor: color }}
        />
    )
}

export function AvatarDisplay({ user, size = 'md' }: { user: User; size?: 'xs' | 'sm' | 'md' }) {
    const emoji = AVATAR_MAP[user.avatar] || '👤'
    const sizeClasses = {
        xs: 'w-8 h-8 text-base',
        sm: 'w-10 h-10 text-lg',
        md: 'w-14 h-14 text-2xl',
    }
    
    return (
        <div className="relative">
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600`}
            >
                {emoji}
            </div>
            {size !== 'xs' && <StatusDot status={user.status} />}
        </div>
    )
}

export function UserCard({ user, onInvite, compact }: UserCardProps) {
    const myUser = useStore((s: AppState) => s.myUser)
    const isMe = myUser?.id === user.id

    const statusConfig = USER_STATUS_CONFIG[user.status as keyof typeof USER_STATUS_CONFIG] || USER_STATUS_CONFIG.online

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <AvatarDisplay user={user} size="sm" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.username}{isMe && ' (You)'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {statusConfig.label}
                    </div>
                </div>
                {!isMe && onInvite && (
                    <button
                        type="button"
                        onClick={() => onInvite(user.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        Invite
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-[160px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex flex-col items-center text-center">
                <AvatarDisplay user={user} />
                
                <div className="mt-3 mb-2 w-full">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.username}
                    </div>
                    {isMe && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You</div>
                    )}
                </div>
                
                <div className="mb-2 w-full">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {statusConfig.label}
                    </span>
                </div>
                
                {(user.is_muted || user.is_camera_off) && (
                    <div className="flex gap-1 mb-2">
                        {user.is_muted && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                🔇
                            </span>
                        )}
                        {user.is_camera_off && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                📵
                            </span>
                        )}
                    </div>
                )}
                
                {!isMe && onInvite && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onInvite(user.id) }}
                        className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                        Invite
                    </button>
                )}
            </div>
        </div>
    )
}

export default function UserGrid({
    users,
    onInvite,
}: {
    users: User[]
    onInvite?: (userId: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {users.map((user) => (
                <UserCard key={user.id} user={user} onInvite={onInvite} />
            ))}
        </div>
    )
}
