import { useStore, type AppState } from '../../store/useStore'
import type { User } from '../../store/useStore'
import { AVATAR_MAP, STATUS_COLORS } from '../../utils/constants'

interface UserCardProps {
    user: User
    onInvite?: (userId: string) => void
    compact?: boolean
}

function StatusDot({ status }: { status: string }) {
    return (
        <div
            className={`status-indicator ${status}`}
            title={status}
        />
    )
}

export function AvatarDisplay({ user, size = 'md' }: { user: User; size?: 'xs' | 'sm' | 'md' }) {
    const emoji = AVATAR_MAP[user.avatar] || '👤'
    return (
        <div className="user-avatar-wrapper">
            <div
                className={`avatar-display ${size}`}
                style={{ background: `${user.color}22`, borderColor: `${user.color}44` }}
            >
                {emoji}
            </div>
            <StatusDot status={user.status} />
        </div>
    )
}

export function UserCard({ user, onInvite, compact }: UserCardProps) {
    const myUser = useStore((s: AppState) => s.myUser)
    const isMe = myUser?.id === user.id

    if (compact) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px' }}>
                <AvatarDisplay user={user} size="sm" />
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.username}{isMe ? ' (you)' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: STATUS_COLORS[user.status] || 'var(--text-muted)' }}>
                        ● {user.status}
                    </div>
                </div>
                {!isMe && onInvite && (
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 'auto', fontSize: '11px' }}
                        onClick={() => onInvite(user.id)}
                    >
                        Invite
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="user-card" style={{ borderColor: `${user.color}22` }}>
            <AvatarDisplay user={user} />
            <div className="user-name">
                {user.username}{isMe ? ' 👤' : ''}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span
                    className={`badge badge-${user.status}`}
                >
                    ● {user.status}
                </span>
                {user.is_muted && <span className="badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>🔇</span>}
                {user.is_camera_off && <span className="badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>📵</span>}
            </div>
            {!isMe && onInvite && (
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); onInvite(user.id) }}
                >
                    ✉️ Invite to Cabin
                </button>
            )}
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
        <div className="user-grid">
            {users.map((user) => (
                <UserCard key={user.id} user={user} onInvite={onInvite} />
            ))}
        </div>
    )
}
