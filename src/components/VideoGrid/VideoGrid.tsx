import React, { useRef, useEffect } from 'react'
import { useStore, User } from '../../store/useStore'
import { AVATAR_MAP } from '../../utils/constants'

interface VideoGridProps {
    localStream: MediaStream | null
    remoteStreams: Record<string, MediaStream>
    myUser: User
    roomUsers: User[]
    isMuted: boolean
    isCameraOff: boolean
    onCallUser: (userId: string) => void
}

function VideoTile({
    stream,
    user,
    isMuted,
    isLocal,
}: {
    stream?: MediaStream
    user: User
    isMuted?: boolean
    isLocal?: boolean
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const avatarEmoji = AVATAR_MAP[user.avatar] || '👤'

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    return (
        <div className="video-tile" style={{ borderColor: `${user.color}33` }}>
            {stream && !user.is_camera_off ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isLocal}
                    playsInline
                    style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                />
            ) : (
                <div className="video-tile-avatar">
                    <div
                        style={{
                            fontSize: '3.5rem',
                            animation: 'avatar-idle 3s ease-in-out infinite',
                            filter: `drop-shadow(0 0 10px ${user.color}66)`,
                        }}
                    >
                        {avatarEmoji}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {user.username}
                        {isLocal ? ' (You)' : ''}
                    </div>
                </div>
            )}
            <div className="video-tile-name">
                {isLocal ? '📹 You' : user.username}
                {isMuted && ' 🔇'}
                {user.is_camera_off && ' 📵'}
            </div>

            {/* Glow border for active speaker (simplified) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                border: `2px solid ${user.color}44`,
                pointerEvents: 'none',
            }} />
        </div>
    )
}

function VideoGrid({
    localStream,
    remoteStreams,
    myUser,
    roomUsers,
    isMuted,
    isCameraOff,
    onCallUser,
}: VideoGridProps) {
    const totalCount = 1 + Object.keys(remoteStreams).length
    const gridClass = totalCount === 1 ? 'count-1'
        : totalCount === 2 ? 'count-2'
            : totalCount <= 4 ? 'count-4'
                : 'count-n'

    return (
        <div className={`video-grid ${gridClass}`} style={{ flex: 1, minHeight: 0 }}>
            {/* Local stream */}
            <VideoTile
                stream={localStream || undefined}
                user={{ ...myUser, is_muted: isMuted, is_camera_off: isCameraOff }}
                isMuted={isMuted}
                isLocal
            />

            {/* Remote streams */}
            {roomUsers
                .filter((u) => u.id !== myUser.id)
                .map((user) => {
                    const stream = remoteStreams[user.id]
                    if (!stream) {
                        // Show avatar tile even without stream, with call button
                        return (
                            <VideoTile key={user.id} user={user} />
                        )
                    }
                    return (
                        <VideoTile key={user.id} stream={stream} user={user} />
                    )
                })}
        </div>
    )
}

export default VideoGrid
