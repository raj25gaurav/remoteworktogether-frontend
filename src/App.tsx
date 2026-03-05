import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useStore, type AppState, type User, type Room } from './store/useStore'
import { useWebSocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'
import Landing from './components/Landing/Landing'
import Sidebar from './components/Sidebar/Sidebar'
import ChatPanel from './components/Sidebar/ChatPanel'
import UserGrid from './components/Lobby/UserCard'
import ReactionOverlay from './components/ReactionOverlay/ReactionOverlay'
import { Toaster, toast } from 'react-hot-toast'
import { AMBIENT_SOUNDS, AVATAR_MAP } from './utils/constants'
import { VIEW_MODE, MESSAGE_TYPE, ROOM_ID, WS_MESSAGE_TYPE, type ViewMode, type TabType } from './types/enums'

// Lazy load heavy components
import { EmojiPanel, AvatarChat, VideoGrid } from './components/LazyComponents'

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-5 text-slate-500 dark:text-slate-400 text-sm">
    <div className="spinner mr-2" />
    Loading...
  </div>
)

export default function App() {
  const myUser = useStore((s: AppState) => s.myUser)
  const users = useStore((s: AppState) => s.users)
  const rooms = useStore((s: AppState) => s.rooms)
  const currentRoomId = useStore((s: AppState) => s.currentRoomId)
  const wsConnected = useStore((s: AppState) => s.wsConnected)
  const showEmojiPanel = useStore((s: AppState) => s.showEmojiPanel)
  const showAIPanel = useStore((s: AppState) => s.showAIPanel)
  const showChat = useStore((s: AppState) => s.showChat)
  const isMuted = useStore((s: AppState) => s.isMuted)
  const isCameraOff = useStore((s: AppState) => s.isCameraOff)
  const pendingInvite = useStore((s: AppState) => s.pendingInvite)
  const ambientSound = useStore((s: AppState) => s.ambientSound)
  const toggleEmojiPanel = useStore((s: AppState) => s.toggleEmojiPanel)
  const toggleAIPanel = useStore((s: AppState) => s.toggleAIPanel)
  const toggleChat = useStore((s: AppState) => s.toggleChat)
  const toggleMute = useStore((s: AppState) => s.toggleMute)
  const toggleCamera = useStore((s: AppState) => s.toggleCamera)
  const setPendingInvite = useStore((s: AppState) => s.setPendingInvite)
  const setAmbientSound = useStore((s: AppState) => s.setAmbientSound)

  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.LOBBY)
  const [isInCabin, setIsInCabin] = useState(false)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const ambientRef = useRef<HTMLAudioElement | null>(null)

  // WebSocket
  const { send } = useWebSocket(myUser?.id ?? null)

  // WebRTC
  const {
    localStream,
    remoteStreams,
    isScreenSharing,
    screenShareStream,
    getLocalStream,
    callUser,
    stopLocalStream,
    closeAllPeers,
    toggleMute: rtcToggleMute,
    toggleCamera: rtcToggleCamera,
    toggleScreenShare,
  } = useWebRTC(myUser?.id ?? null, currentRoomId, send)

  // Derived data — memoized to avoid new array reference on every render
  const currentRoom = useMemo(() => rooms[currentRoomId], [rooms, currentRoomId])
  const roomUsers = useMemo(
    () => Object.values(users).filter((u: User) => u.room_id === currentRoomId),
    [users, currentRoomId]
  )

  // Track if in cabin
  useEffect(() => {
    setIsInCabin(currentRoomId !== ROOM_ID.LOBBY)
  }, [currentRoomId])

  // Handle video mode — start/stop video stream and call users
  useEffect(() => {
    if (viewMode === VIEW_MODE.VIDEO && !localStream) {
      getLocalStream().then((stream) => {
        if (stream) {
          // After local stream is ready, call all other users in the room
          setTimeout(() => {
            roomUsers
              .filter((u) => u.id !== myUser?.id)
              .forEach((user) => {
                callUser(user.id)
              })
          }, 1000) // Give time for stream to be fully set up
        }
      })
    }
    if (viewMode !== VIEW_MODE.VIDEO) {
      stopLocalStream()
      closeAllPeers()
    }
  }, [viewMode, localStream, getLocalStream, stopLocalStream, closeAllPeers, callUser, roomUsers, myUser?.id])

  // Call new users when they join the room while in video mode
  useEffect(() => {
    if (viewMode === VIEW_MODE.VIDEO && localStream) {
      const usersToCall = roomUsers.filter(
        (u) => u.id !== myUser?.id && !remoteStreams[u.id]
      )
      
      if (usersToCall.length > 0) {
        setTimeout(() => {
          usersToCall.forEach((user) => {
            callUser(user.id)
          })
        }, 500)
      }
    }
  }, [roomUsers.length, viewMode, localStream, remoteStreams, callUser, myUser?.id])

  // Sync WebRTC mute/camera
  useEffect(() => { rtcToggleMute(isMuted) }, [isMuted])
  useEffect(() => { rtcToggleCamera(isCameraOff) }, [isCameraOff])

  // Ambient sound control
  useEffect(() => {
    if (ambientSound) {
      const sound = AMBIENT_SOUNDS[ambientSound]
      if (sound) {
        if (!ambientRef.current) {
          ambientRef.current = new Audio(sound.url)
          ambientRef.current.loop = true
          ambientRef.current.volume = 0.3
        }
        ambientRef.current.play().catch(() => { })
      }
    } else {
      ambientRef.current?.pause()
      ambientRef.current = null
    }
    return () => { ambientRef.current?.pause() }
  }, [ambientSound])

  // Send reaction
  const sendReaction = useCallback((content: string, type: TabType) => {
    send(WS_MESSAGE_TYPE.REACTION, {
      content,
      reaction_type: type,
      room_id: currentRoomId,
      x: Math.random() * 70 + 10,
      y: Math.random() * 60 + 10,
    })
    // Also send as chat message for GIFs
    if (type === MESSAGE_TYPE.GIF) {
      send(WS_MESSAGE_TYPE.CHAT_MESSAGE, {
        content,
        room_id: currentRoomId,
        message_type: MESSAGE_TYPE.GIF,
      })
    }
  }, [send, currentRoomId])

  // Invite user to current room
  const inviteUser = useCallback((targetUserId: string) => {
    send(WS_MESSAGE_TYPE.ROOM_INVITE, {
      target_user_id: targetUserId,
      room_id: currentRoomId,
    })
    toast.success('Invitation sent! 🎉', { className: 'toast' })
    setShowInvitePanel(false)
  }, [send, currentRoomId])

  // Lobby users not yet in current cabin — for invite panel
  const lobbyUsersToInvite = useMemo(
    () => Object.values(users).filter((u: User) => u.id !== myUser?.id && u.room_id === ROOM_ID.LOBBY),
    [users, myUser]
  )

  // Accept invite
  const acceptInvite = useCallback(() => {
    if (pendingInvite) {
      send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: pendingInvite.room.id })
      setPendingInvite(null)
      toast.success(`Joined ${pendingInvite.room.name}! 🚀`, { className: 'toast' })
    }
  }, [pendingInvite, send, setPendingInvite])

  if (!myUser) {
    return <Landing />
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 relative">
      <div className="animated-bg" />
      <Toaster position="top-center" />
      <ReactionOverlay />

      {/* Emoji Panel floating */}
      {showEmojiPanel && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-[slide-in-up_0.2s_ease]">
          <Suspense fallback={<LoadingFallback />}>
            <EmojiPanel
              onSend={sendReaction}
              onClose={toggleEmojiPanel}
            />
          </Suspense>
        </div>
      )}

      {/* Invite notification */}
      {pendingInvite && (
        <div className="fixed bottom-6 right-6 z-[200] w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-5 animate-[slide-in-up_0.3s_ease]">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Meeting invitation from <strong className="text-slate-900 dark:text-white">{pendingInvite.from_user}</strong>
          </div>
          <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">
            {pendingInvite.room.emoji} Join "{pendingInvite.room.name}"?
          </div>
          {pendingInvite.room.description && (
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {pendingInvite.room.description}
            </div>
          )}
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={acceptInvite}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Accept
            </button>
            <button 
              type="button"
              onClick={() => setPendingInvite(null)}
              className="flex-1 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <Sidebar send={send} currentRoomId={currentRoomId} isOpen={showMobileSidebar} onClose={() => setShowMobileSidebar(false)} />

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 relative z-10">
          {/* Top Bar */}
          <header className="h-16 flex items-center px-6 gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            {/* Room info */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                {currentRoom?.emoji || '🏢'}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {currentRoom?.name || 'Main Office'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {roomUsers.length} {roomUsers.length === 1 ? 'colleague' : 'colleagues'} checked in
                  {isInCabin && ' • Private'}
                </div>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODE.LOBBY)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  viewMode === VIEW_MODE.LOBBY
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                👥 People
              </button>
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODE.VIDEO)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  viewMode === VIEW_MODE.VIDEO
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎥 Video
              </button>
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setShowMobileSidebar(true)}
                title="Menu"
                className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ☰
              </button>

              {/* Mute */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  isMuted
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              {/* Camera */}
              <button
                type="button"
                onClick={toggleCamera}
                title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  isCameraOff
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isCameraOff ? '📵' : '📹'}
              </button>

              {/* Emoji */}
              <button
                type="button"
                onClick={toggleEmojiPanel}
                title="Reactions & GIFs"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  showEmojiPanel
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                😄
              </button>

              {/* Screen Share */}
              {viewMode === VIEW_MODE.VIDEO && (
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                    isScreenSharing
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isScreenSharing ? '🛑' : '🖥️'}
                </button>
              )}

              {/* Ambient sound */}
              <button
                type="button"
                onClick={() => {
                  if (ambientSound) {
                    setAmbientSound(null)
                  } else {
                    setAmbientSound('lofi')
                  }
                }}
                title="Ambient Sounds"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  ambientSound
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                🎵
              </button>

              {/* WS status */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                wsConnected
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
                {wsConnected ? 'Connected' : 'Reconnecting'}
              </div>

              {/* Toggle panels */}
              <button 
                type="button"
                onClick={toggleChat}
                className={`hidden lg:flex px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showChat
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Chat
              </button>
              <button 
                type="button"
                onClick={toggleAIPanel}
                className={`hidden lg:flex px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showAIPanel
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                AI
              </button>
            </div>
          </header>

          {/* Content Row */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Main Area */}
            <main className={`flex-1 overflow-y-auto overflow-x-hidden ${viewMode === 'video' ? 'p-4' : 'p-6'}`}>
              {/* Video Mode */}
              {viewMode === 'video' ? (
                <div className="h-full min-h-0">
                  <Suspense fallback={<LoadingFallback />}>
                    <VideoGrid
                      localStream={localStream}
                      remoteStreams={remoteStreams}
                      myUser={myUser}
                      roomUsers={roomUsers}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      isScreenSharing={isScreenSharing}
                      screenShareStream={screenShareStream}
                      onCallUser={callUser}
                    />
                  </Suspense>
                </div>
              ) : (
                <>
                  {/* Section header */}
                  <header className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {isInCabin ? (
                        <>{currentRoom?.emoji} {currentRoom?.name}</>
                      ) : (
                        <>Main Office</>
                      )}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isInCabin
                        ? currentRoom?.description || 'Your private meeting room — invite your team!'
                        : 'Welcome to the office. Check in with your team or head to a meeting room.'}
                    </p>
                  </header>

                  {/* User grid */}
                  {roomUsers.length === 0 ? (
                    <div className="text-center py-16 px-5">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                        <div className="text-3xl">👔</div>
                      </div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No one checked in yet</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Invite colleagues from the sidebar to join this room</div>
                    </div>
                  ) : (
                    <UserGrid users={roomUsers} onInvite={inviteUser} />
                  )}

                  {/* ── Invite to Cabin panel (only shown when inside a cabin) ── */}
                  {isInCabin && (
                    <section className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Invite from Main Office ({lobbyUsersToInvite.length})
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInvitePanel(!showInvitePanel)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {showInvitePanel ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {showInvitePanel && (
                        lobbyUsersToInvite.length === 0 ? (
                          <div className="text-sm text-slate-600 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            No colleagues available in the main office right now.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {lobbyUsersToInvite.map((u: User) => (
                              <div 
                                key={u.id} 
                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all"
                              >
                                <span className="text-xl">{AVATAR_MAP[u.avatar] || '👤'}</span>
                                <span className="flex-1 font-medium text-sm text-slate-900 dark:text-white">{u.username}</span>
                                <button
                                  type="button"
                                  onClick={() => inviteUser(u.id)}
                                  className="px-4 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                >
                                  Invite
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </section>
                  )}

                  {/* All-lobby: show other spaces */}
                  {!isInCabin && (
                    <section className="mt-10">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
                        Meeting Rooms
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                        {Object.values(rooms)
                          .filter((r: Room) => r.id !== ROOM_ID.LOBBY)
                          .map((room: Room) => {
                            const mem = Object.values(users).filter((u: User) => u.room_id === room.id)
                            return (
                              <div 
                                key={room.id} 
                                className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                                onClick={() => send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: room.id })}
                              >
                                <div className="text-2xl mb-3">{room.emoji}</div>
                                <div className="font-semibold text-sm text-slate-900 dark:text-white mb-2">{room.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                                  <span>{mem.length} {mem.length === 1 ? 'colleague' : 'colleagues'}</span>
                                  {room.is_private && <span>🔒</span>}
                                </div>
                                <div className="flex gap-1.5 items-center">
                                  {mem.slice(0, 4).map((u: User) => (
                                    <span key={u.id} className="text-base">
                                      {AVATAR_MAP[u.avatar] || '👤'}
                                    </span>
                                  ))}
                                  {mem.length > 4 && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">+{mem.length - 4}</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </section>
                  )}

                  {/* Ambient sound selector */}
                  {!isInCabin && (
                    <section className="mt-10">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
                        Focus Mode
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(AMBIENT_SOUNDS).map(([key, s]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setAmbientSound(ambientSound === key ? null : key)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              ambientSound === key
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {s.icon} {s.label}
                            {ambientSound === key && ' ♪'}
                          </button>
                        ))}
                        {ambientSound && (
                          <button 
                            type="button"
                            onClick={() => setAmbientSound(null)}
                            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            ⏹ Stop
                          </button>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </main>

            {/* Chat Panel */}
            {showChat && (
              <ChatPanel
                send={send}
                roomId={currentRoomId}
                onToggleEmoji={toggleEmojiPanel}
              />
            )}

            {/* AI Avatar Panel */}
            {showAIPanel && (
              <Suspense fallback={<LoadingFallback />}>
                <AvatarChat roomId={currentRoomId} />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 flex items-center justify-around px-2">
        <button 
          type="button"
          onClick={() => setShowMobileSidebar(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-slate-600 dark:text-slate-400"
        >
          <span className="text-lg">☰</span>
          <span>Menu</span>
        </button>
        <button 
          type="button"
          onClick={toggleChat}
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
            showChat
              ? 'text-blue-500'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-lg">💬</span>
          <span>Chat</span>
        </button>
        <button 
          type="button"
          onClick={toggleAIPanel}
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
            showAIPanel
              ? 'text-blue-500'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-lg">🤖</span>
          <span>AI</span>
        </button>
        <button 
          type="button"
          onClick={toggleMute}
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
            isMuted
              ? 'text-red-500'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="text-lg">{isMuted ? '🔇' : '🎤'}</span>
          <span>{isMuted ? 'Muted' : 'Mic'}</span>
        </button>
      </nav>

      {/* Mobile Chat Drawer */}
      {showChat && (
        <div className="lg:hidden flex flex-col fixed bottom-16 left-0 right-0 h-[65vh] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-t-xl z-[45] animate-[slide-in-up_0.3s_ease] overflow-hidden shadow-xl">
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-0 cursor-pointer flex-shrink-0" onClick={toggleChat} />
          <ChatPanel send={send} roomId={currentRoomId} onToggleEmoji={toggleEmojiPanel} />
        </div>
      )}

      {/* Mobile AI Drawer */}
      {showAIPanel && (
        <div className="lg:hidden flex flex-col fixed bottom-16 left-0 right-0 h-[65vh] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-t-xl z-[45] animate-[slide-in-up_0.3s_ease] overflow-hidden shadow-xl">
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-0 cursor-pointer flex-shrink-0" onClick={toggleAIPanel} />
          <Suspense fallback={<LoadingFallback />}>
            <AvatarChat roomId={currentRoomId} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
