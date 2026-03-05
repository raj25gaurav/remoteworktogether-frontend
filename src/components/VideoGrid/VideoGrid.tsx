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

    const hasVideo = stream && !user.is_camera_off

    return (
        <div className="relative bg-slate-900 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-700 dark:border-slate-800 group aspect-video">
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isLocal}
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-4">
                    <div className="text-4xl mb-2 animate-[avatar-idle_3s_ease-in-out_infinite]">
                        {avatarEmoji}
                    </div>
                    <div className="text-xs font-medium text-slate-300 dark:text-slate-400 text-center">
                        {user.username}
                        {isLocal && ' (You)'}
                    </div>
                </div>
            )}
            
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                    <span>{isLocal ? 'You' : user.username}</span>
                    {isMuted && <span className="text-[10px]">🔇</span>}
                    {user.is_camera_off && <span className="text-[10px]">📵</span>}
                </div>
            </div>

            {/* Active speaker indicator */}
            {!isLocal && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
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
    const allUsers = [myUser, ...roomUsers.filter((u) => u.id !== myUser.id)]
    const totalCount = allUsers.length

    // Calculate grid layout based on participant count
    const getGridClass = () => {
        if (totalCount === 1) return 'grid-cols-1 max-w-md'
        if (totalCount === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
        if (totalCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl'
        if (totalCount === 4) return 'grid-cols-2 max-w-2xl'
        if (totalCount <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-4xl'
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-5xl'
    }

    return (
        <div className="flex items-start justify-center h-full overflow-y-auto p-4">
            <div className={`grid ${getGridClass()} gap-3 w-full`}>
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
                        return (
                            <VideoTile
                                key={user.id}
                                stream={stream}
                                user={user}
                                isMuted={user.is_muted}
                            />
                        )
                    })}
            </div>
        </div>
    )
}

export default VideoGrid
