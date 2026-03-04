import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore, type AppState, type User, type Room } from './store/useStore'
import { useWebSocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'
import Landing from './components/Landing/Landing'
import Sidebar from './components/Sidebar/Sidebar'
import ChatPanel from './components/Sidebar/ChatPanel'
import UserGrid from './components/Lobby/UserCard'
import VideoGrid from './components/VideoGrid/VideoGrid'
import EmojiPanel from './components/EmojiPanel/EmojiPanel'
import AvatarChat from './components/AvatarChat/AvatarChat'
import ReactionOverlay from './components/ReactionOverlay/ReactionOverlay'
import { Toaster, toast } from 'react-hot-toast'
import { AMBIENT_SOUNDS, AVATAR_MAP } from './utils/constants'
import { VIEW_MODE, MESSAGE_TYPE, ROOM_ID, WS_MESSAGE_TYPE, type ViewMode, type TabType } from './types/enums'

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
    getLocalStream,
    callUser,
    stopLocalStream,
    closeAllPeers,
    toggleMute: rtcToggleMute,
    toggleCamera: rtcToggleCamera,
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

  // Handle room change — join video automatically in cabin
  useEffect(() => {
    if (isInCabin && !localStream) {
      getLocalStream()
    }
    if (!isInCabin) {
      stopLocalStream()
      closeAllPeers()
    }
  }, [isInCabin])

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
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className="animated-bg" />
      <Toaster position="top-center" />
      <ReactionOverlay />

      {/* Emoji Panel floating */}
      {showEmojiPanel && (
        <div style={{
          position: 'fixed',
          bottom: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          animation: 'slide-in-up 0.2s ease',
        }}>
          <EmojiPanel
            onSend={sendReaction}
            onClose={toggleEmojiPanel}
          />
        </div>
      )}

      {/* Invite notification */}
      {pendingInvite && (
        <div className="invite-popup">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Invitation from <strong style={{ color: 'var(--text-primary)' }}>{pendingInvite.from_user}</strong>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
            {pendingInvite.room.emoji} Join "{pendingInvite.room.name}"?
          </div>
          {pendingInvite.room.description && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {pendingInvite.room.description}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" style={{ flex: 2, fontSize: '13px' }} onClick={acceptInvite}>
              ✅ Join Now
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: '13px' }} onClick={() => setPendingInvite(null)}>
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Sidebar */}
        <Sidebar send={send} currentRoomId={currentRoomId} isOpen={showMobileSidebar} onClose={() => setShowMobileSidebar(false)} />

        {/* Mobile sidebar darkened overlay */}
        {showMobileSidebar && (
          <div
            onClick={() => setShowMobileSidebar(false)}
            className="mobile-overlay"
          />
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Top Bar */}
          <div className="topbar">
            {/* Room info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isInCabin ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${isInCabin ? 'rgba(236,72,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {currentRoom?.emoji || '🏠'}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
                  {currentRoom?.name || 'Main Lobby'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {roomUsers.length} {roomUsers.length === 1 ? 'person' : 'people'} here
                  {isInCabin && ' • Private Cabin 🔒'}
                </div>
              </div>
            </div>

            {/* View toggle (cabin only) */}
            {isInCabin && (
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: 10, padding: '4px' }}>
                <button
                  className={`btn btn-sm ${viewMode === VIEW_MODE.LOBBY ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode(VIEW_MODE.LOBBY)}
                >
                  👥 People
                </button>
                <button
                  className={`btn btn-sm ${viewMode === VIEW_MODE.VIDEO ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode(VIEW_MODE.VIDEO)}
                >
                  🎥 Video
                </button>
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Mobile hamburger */}
              <button
                className="btn btn-ghost btn-icon btn-sm mobile-only"
                onClick={() => setShowMobileSidebar(true)}
                title="Menu"
              >
                ☰
              </button>

              {/* Mute */}
              <button
                className={`btn btn-icon btn-sm ${isMuted ? 'btn-danger' : 'btn-ghost'}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              {/* Camera */}
              <button
                className={`btn btn-icon btn-sm ${isCameraOff ? 'btn-danger' : 'btn-ghost'}`}
                onClick={toggleCamera}
                title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? '📵' : '📹'}
              </button>

              {/* Emoji */}
              <button
                className={`btn btn-icon btn-sm ${showEmojiPanel ? 'btn-primary' : 'btn-ghost'}`}
                onClick={toggleEmojiPanel}
                title="Reactions & GIFs"
              >
                😄
              </button>

              {/* Ambient sound */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`btn btn-icon btn-sm ${ambientSound ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    if (ambientSound) {
                      setAmbientSound(null)
                    } else {
                      setAmbientSound('lofi')
                    }
                  }}
                  title="Ambient Sounds"
                >
                  🎵
                </button>
              </div>

              {/* WS status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px',
                background: wsConnected ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                border: `1px solid ${wsConnected ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                borderRadius: 999, fontSize: '11px',
                color: wsConnected ? '#10b981' : '#f43f5e',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: wsConnected ? '#10b981' : '#f43f5e',
                  animation: wsConnected ? 'status-dot 2s infinite' : 'none',
                }} />
                {wsConnected ? 'Connected' : 'Reconnecting...'}
              </div>

              {/* Toggle panels */}
              <button className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'} desktop-only`} onClick={toggleChat}>
                💬
              </button>
              <button className={`btn btn-sm ${showAIPanel ? 'btn-primary' : 'btn-ghost'} desktop-only`} onClick={toggleAIPanel}>
                🤖
              </button>
            </div>
          </div>

          {/* Content Row */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            {/* Main Area */}
            <div className="content-area" style={{ padding: isInCabin && viewMode === 'video' ? '12px' : '20px' }}>
              {/* Cabin Video Mode */}
              {isInCabin && viewMode === 'video' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <VideoGrid
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    myUser={myUser}
                    roomUsers={roomUsers}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    onCallUser={callUser}
                  />
                </div>
              ) : (
                <>
                  {/* Section header */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
                      {isInCabin ? (
                        <>{currentRoom?.emoji} {currentRoom?.name}</>
                      ) : (
                        <>🏠 Main Lobby</>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {isInCabin
                        ? currentRoom?.description || 'Your private cabin — invite your crew!'
                        : 'Everyone is here — say hello, react, or head to a private cabin!'}
                    </p>
                  </div>

                  {/* User grid */}
                  {roomUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👻</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>It's quiet here...</div>
                      <div style={{ fontSize: '13px' }}>Invite someone from the sidebar to join you!</div>
                    </div>
                  ) : (
                    <UserGrid users={roomUsers} onInvite={inviteUser} />
                  )}

                  {/* ── Invite to Cabin panel (only shown when inside a cabin) ── */}
                  {isInCabin && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          📨 Invite from Lobby ({lobbyUsersToInvite.length})
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowInvitePanel(!showInvitePanel)}
                        >
                          {showInvitePanel ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {showInvitePanel && (
                        lobbyUsersToInvite.length === 0 ? (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            No one in the lobby to invite right now.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {lobbyUsersToInvite.map((u: User) => (
                              <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 14px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                              }}>
                                <span style={{ fontSize: '1.4rem' }}>{AVATAR_MAP[u.avatar] || '👤'}</span>
                                <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>{u.username}</span>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => inviteUser(u.id)}
                                >
                                  Invite
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* All-lobby: show other spaces */}
                  {!isInCabin && (
                    <div style={{ marginTop: '32px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Other Spaces
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {Object.values(rooms)
                          .filter((r: Room) => r.id !== ROOM_ID.LOBBY)
                          .map((room: Room) => {
                            const mem = Object.values(users).filter((u: User) => u.room_id === room.id)
                            return (
                              <div key={room.id} className="card" style={{ minWidth: 180, cursor: 'pointer' }}
                                onClick={() => send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: room.id })}>
                                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{room.emoji}</div>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{room.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                  {mem.length} {mem.length === 1 ? 'person' : 'people'}
                                  {room.is_private ? ' 🔒' : ''}
                                </div>
                                {mem.slice(0, 3).map((u: User) => (
                                  <span key={u.id} style={{ fontSize: '1rem', marginRight: '2px' }}>
                                    {AVATAR_MAP[u.avatar] || '👤'}
                                  </span>
                                ))}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Ambient sound selector */}
                  {!isInCabin && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Ambient Sounds
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(AMBIENT_SOUNDS).map(([key, s]) => (
                          <button
                            key={key}
                            className={`btn btn-sm ${ambientSound === key ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setAmbientSound(ambientSound === key ? null : key)}
                          >
                            {s.icon} {s.label}
                            {ambientSound === key && ' ♪'}
                          </button>
                        ))}
                        {ambientSound && (
                          <button className="btn btn-sm btn-ghost" onClick={() => setAmbientSound(null)}>
                            ⏹ Stop
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

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
              <AvatarChat roomId={currentRoomId} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav bar */}
      <div className="mobile-bottom-bar">
        <button className={`btn btn-ghost btn-sm`} onClick={() => setShowMobileSidebar(true)}>☰ Menu</button>
        <button className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleChat}>💬 Chat</button>
        <button className={`btn btn-sm ${showAIPanel ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleAIPanel}>🤖 AI</button>
        <button className={`btn btn-sm ${isMuted ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleMute}>{isMuted ? '🔇' : '🎤'}</button>
      </div>

      {/* Mobile Chat Drawer */}
      {showChat && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-handle" onClick={toggleChat} />
          <ChatPanel send={send} roomId={currentRoomId} onToggleEmoji={toggleEmojiPanel} />
        </div>
      )}

      {/* Mobile AI Drawer */}
      {showAIPanel && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-handle" onClick={toggleAIPanel} />
          <AvatarChat roomId={currentRoomId} />
        </div>
      )}
    </div>
  )
}
