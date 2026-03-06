import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore, type AppState, type User, type Room } from './store/useStore'
import { useWebSocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'
import Landing from './components/Landing/Landing'
import Sidebar from './components/Sidebar/Sidebar'
import ChatPanel from './components/Sidebar/ChatPanel'
import FriendsPanel from './components/Sidebar/FriendsPanel'
import UserGrid from './components/Lobby/UserCard'
import VideoGrid from './components/VideoGrid/VideoGrid'
import EmojiPanel from './components/EmojiPanel/EmojiPanel'
import AvatarChat from './components/AvatarChat/AvatarChat'
import ReactionOverlay from './components/ReactionOverlay/ReactionOverlay'
import FeedbackModal from './components/FeedbackModal'
import { OfficeTicker, PomodoroWidget, DailyQuote, ProductivityMeter, OfficeVibe } from './components/OfficeWidgets'
import { Toaster, toast } from 'react-hot-toast'
import { AMBIENT_SOUNDS, AVATAR_MAP, API_URL } from './utils/constants'
import { VIEW_MODE, MESSAGE_TYPE, ROOM_ID, WS_MESSAGE_TYPE, type ViewMode, type TabType } from './types/enums'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}


export default function App() {
  const myUser = useStore((s: AppState) => s.myUser)
  const dbUser = useStore((s: AppState) => s.dbUser)
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
  const setMyUser = useStore((s: AppState) => s.setMyUser)
  const setDbUser = useStore((s: AppState) => s.setDbUser)

  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.LOBBY)
  const [isInCabin, setIsInCabin] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [showClockOut, setShowClockOut] = useState(false)
  const [sessionMs, setSessionMs] = useState(0)
  const [productivityScore, setProductivityScore] = useState(42)
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'friends' | 'ai'>('chat')
  const [activeDbSessionId, setActiveDbSessionId] = useState<string | null>(null)
  const ambientRef = useRef<HTMLAudioElement | null>(null)

  // ── Session Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myUser) return
    const clockInTime = parseInt(sessionStorage.getItem('clockInTime') || '0') || Date.now()
    const tick = () => setSessionMs(Date.now() - clockInTime)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [myUser])

  // ── DB Session Tracking (start when logged in) ────────────────────────────
  useEffect(() => {
    if (!myUser || !dbUser) return
    // Start a lobby session
    fetch(`${API_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: dbUser.id, location_type: 'lobby', room_name: 'lobby' }),
    }).then(r => r.json()).then(d => {
      if (d.session_id) setActiveDbSessionId(d.session_id)
    }).catch(() => { })

    return () => {
      // End session on unmount
      const sid = activeDbSessionId
      if (sid && dbUser) {
        navigator.sendBeacon(`${API_URL}/api/session/end`,
          JSON.stringify({ session_id: sid, user_id: dbUser.id, location_type: currentRoomId === 'lobby' ? 'lobby' : 'cabin' })
        )
      }
    }
  }, [myUser, dbUser])

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const { send } = useWebSocket(myUser?.id ?? null)

  // ── WebRTC ────────────────────────────────────────────────────────────────
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

  // Derived data
  const currentRoom = useMemo(() => rooms[currentRoomId], [rooms, currentRoomId])
  const roomUsers = useMemo(
    () => Object.values(users).filter((u: User) => u.room_id === currentRoomId),
    [users, currentRoomId]
  )

  // Track if in meeting room
  useEffect(() => {
    setIsInCabin(currentRoomId !== ROOM_ID.LOBBY)
  }, [currentRoomId])

  // Handle video enable/disable
  useEffect(() => {
    if (videoEnabled && !localStream) {
      getLocalStream().then((stream) => {
        if (!stream) return
        const others = Object.values(useStore.getState().users).filter(
          (u: User) => u.id !== myUser?.id && u.room_id === useStore.getState().currentRoomId
        )
        others.forEach((u: User) => callUser(u.id))
      })
    }
    if (!videoEnabled) {
      stopLocalStream()
      closeAllPeers()
    }
  }, [videoEnabled])

  // When entering a meeting room, auto-enable video
  useEffect(() => {
    if (!isInCabin) {
      setViewMode(VIEW_MODE.LOBBY)
      setVideoEnabled(false)
      closeAllPeers()
      stopLocalStream()
    }
    if (isInCabin) {
      setVideoEnabled(true)
    }
  }, [isInCabin])

  // Sync WebRTC mute/camera
  useEffect(() => { rtcToggleMute(isMuted) }, [isMuted])
  useEffect(() => { rtcToggleCamera(isCameraOff) }, [isCameraOff])

  // When a new peer joins, call them
  useEffect(() => {
    const handler = (e: Event) => {
      const { userId: peerId } = (e as CustomEvent).detail
      if (localStream && peerId) callUser(peerId)
    }
    window.addEventListener('peer-joined', handler)
    return () => window.removeEventListener('peer-joined', handler)
  }, [localStream, callUser])

  // Ambient sound
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

  // Send reaction — also bumps productivity score
  const sendReaction = useCallback((content: string, type: TabType) => {
    send(WS_MESSAGE_TYPE.REACTION, {
      content,
      reaction_type: type,
      room_id: currentRoomId,
      x: Math.random() * 70 + 10,
      y: Math.random() * 60 + 10,
    })
    if (type === MESSAGE_TYPE.GIF) {
      send(WS_MESSAGE_TYPE.CHAT_MESSAGE, {
        content,
        room_id: currentRoomId,
        message_type: MESSAGE_TYPE.GIF,
      })
    }
    setProductivityScore(s => Math.min(100, s + 2))
  }, [send, currentRoomId])

  // Invite colleague to meeting room — bumps score
  const inviteUser = useCallback((targetUserId: string) => {
    send(WS_MESSAGE_TYPE.ROOM_INVITE, {
      target_user_id: targetUserId,
      room_id: currentRoomId,
    })
    toast.success('Meeting invite sent! 📨', { className: 'toast' })
    setProductivityScore(s => Math.min(100, s + 5))
  }, [send, currentRoomId])

  // Colleagues in the open floor (lobby) — available to invite
  const lobbyUsersToInvite = useMemo(
    () => Object.values(users).filter((u: User) => u.id !== myUser?.id && u.room_id === ROOM_ID.LOBBY),
    [users, myUser]
  )

  // Accept meeting invite
  const acceptInvite = useCallback(() => {
    if (pendingInvite) {
      send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: pendingInvite.room.id })
      setPendingInvite(null)
      toast.success(`You joined "${pendingInvite.room.name}" 🤝`, { className: 'toast' })
    }
  }, [pendingInvite, send, setPendingInvite])

  // Clock Out — end DB session + show feedback modal to collect
  const handleClockOut = useCallback(async () => {
    if (activeDbSessionId && dbUser) {
      await fetch(`${API_URL}/api/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeDbSessionId,
          user_id: dbUser.id,
          location_type: isInCabin ? 'cabin' : 'lobby',
        }),
      }).catch(() => { })
    }
    sessionStorage.removeItem('clockInTime')
    sessionStorage.removeItem('dbUserId')
    stopLocalStream()
    closeAllPeers()
    setMyUser(null)
    setDbUser(null)
    setActiveDbSessionId(null)
    setShowClockOut(false)
  }, [stopLocalStream, closeAllPeers, setMyUser, setDbUser, activeDbSessionId, dbUser, isInCabin])

  // ── Show Landing (Clock In) if not logged in ──────────────────────────────
  if (!myUser) return <Landing />

  // Room label — office-friendly names
  const roomLabel = isInCabin
    ? (currentRoom?.name || 'Meeting Room')
    : 'Open Floor Plan'

  const roomSubLabel = isInCabin
    ? `${roomUsers.length} colleague${roomUsers.length !== 1 ? 's' : ''} in meeting • Private 🔒`
    : `${roomUsers.length} colleague${roomUsers.length !== 1 ? 's' : ''} at their desks`

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className="animated-bg" />
      <Toaster position="top-center" />
      <ReactionOverlay />

      {/* Feedback + Clock Out Modal */}
      {showClockOut && (
        <FeedbackModal
          duration={formatDuration(sessionMs)}
          userId={dbUser?.id ?? null}
          onConfirm={handleClockOut}
          onCancel={() => setShowClockOut(false)}
        />
      )}

      {/* Emoji / Reaction Panel */}
      {showEmojiPanel && (
        <div style={{
          position: 'fixed', bottom: 76, left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          animation: 'slide-in-up 0.2s ease',
        }}>
          <EmojiPanel onSend={sendReaction} onClose={toggleEmojiPanel} />
        </div>
      )}

      {/* Meeting Invite notification */}
      {pendingInvite && (
        <div className="invite-popup">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            📩 Meeting request from <strong style={{ color: 'var(--text-primary)' }}>{pendingInvite.from_user}</strong>
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
              ✅ Accept & Join
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

        {/* Mobile overlay */}
        {showMobileSidebar && (
          <div onClick={() => setShowMobileSidebar(false)} className="mobile-overlay" />
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* ── Office Ticker (always visible) ────────────────────────── */}
          <OfficeTicker />

          {/* ── Top Bar ───────────────────────────────────────────────────── */}
          <div className="topbar">
            {/* Room / Location info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isInCabin ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${isInCabin ? 'rgba(236,72,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {currentRoom?.emoji || '🏢'}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
                  {roomLabel}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {roomSubLabel}
                </div>
              </div>
            </div>

            {/* Session timer — "Time on Clock" */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: 999, fontSize: '12px', fontWeight: 700,
              color: '#10b981', fontFamily: 'var(--font-display)',
              marginRight: '4px',
            }}>
              ⏱️ {formatDuration(sessionMs)}
            </div>

            {/* Office vibe chip */}
            <OfficeVibe />

            {/* ON AIR badge when in meeting with video */}
            {isInCabin && videoEnabled && (
              <div className="on-air-badge desktop-only">
                <div className="on-air-dot" />
                ON AIR
              </div>
            )}

            {/* View toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: 10, padding: '4px' }}>
              <button
                className={`btn btn-sm ${viewMode === VIEW_MODE.LOBBY ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode(VIEW_MODE.LOBBY)}
              >
                👥 Headcount
              </button>
              <button
                className={`btn btn-sm ${viewMode === VIEW_MODE.VIDEO ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setViewMode(VIEW_MODE.VIDEO); setVideoEnabled(true) }}
              >
                🎥 Face Time
              </button>
              {isInCabin && (
                <button
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: '12px' }}
                  onClick={() => send(WS_MESSAGE_TYPE.ROOM_JOIN, { room_id: 'lobby' })}
                  title="Leave meeting room and return to open floor"
                >
                  🚪 Step Out
                </button>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Mobile hamburger */}
              <button className="btn btn-ghost btn-icon btn-sm mobile-only" onClick={() => setShowMobileSidebar(true)} title="Menu">
                ☰
              </button>

              {/* Mute — "Hold" */}
              <button
                className={`btn btn-icon btn-sm ${isMuted ? 'btn-danger' : 'btn-ghost'}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute mic' : 'Mute mic'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              {/* Camera */}
              <button
                className={`btn btn-icon btn-sm ${isCameraOff ? 'btn-danger' : 'btn-ghost'}`}
                onClick={toggleCamera}
                title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isCameraOff ? '📵' : '📹'}
              </button>

              {/* Water Cooler (Reactions) */}
              <button
                className={`btn btn-icon btn-sm ${showEmojiPanel ? 'btn-primary' : 'btn-ghost'}`}
                onClick={toggleEmojiPanel}
                title="Water Cooler (Reactions & GIFs)"
              >
                🎉
              </button>

              {/* Background Music */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`btn btn-icon btn-sm ${ambientSound ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAmbientSound(ambientSound ? null : 'lofi')}
                  title="Office Background Music"
                >
                  🎵
                </button>
              </div>

              {/* Connection status */}
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
                {wsConnected ? 'Online' : 'Reconnecting...'}
              </div>

              {/* Chat — "Slack" */}
              <button className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'} desktop-only`} onClick={toggleChat} title="Office Chat">
                💬
              </button>
              {/* AI Colleague */}
              <button className={`btn btn-sm ${showAIPanel ? 'btn-primary' : 'btn-ghost'} desktop-only`} onClick={toggleAIPanel} title="AI Colleague">
                🤖
              </button>

              {/* Clock Out */}
              <button
                className="btn btn-sm btn-danger desktop-only"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                title="Clock Out"
                onClick={() => setShowClockOut(true)}
              >
                🔴 Clock Out
              </button>
            </div>
          </div>

          {/* ── Content Row ───────────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            {/* Main Area */}
            <div className="content-area" style={{ padding: viewMode === 'video' ? '12px' : '20px' }}>

              {/* Face Time (Video) View */}
              {viewMode === 'video' ? (
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
                        <>🏢 Open Floor Plan</>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {isInCabin
                        ? currentRoom?.description || 'Private meeting room — pull in your colleagues!'
                        : 'Everyone at their desks — ping someone, react, or book a meeting room!'}
                    </p>
                  </div>

                  {/* Lobby-only: widgets row above colleague grid */}
                  {!isInCabin && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                      <PomodoroWidget />
                      <ProductivityMeter score={productivityScore} />
                      <DailyQuote />
                    </div>
                  )}

                  {/* Colleague grid */}
                  {roomUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🖥️</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Nobody's at their desk...</div>
                      <div style={{ fontSize: '13px' }}>Maybe everyone's in a meeting? Try the sidebar!</div>
                    </div>
                  ) : (
                    <UserGrid users={roomUsers} onInvite={inviteUser} />
                  )}

                  {/* ── "Ping to Join" panel inside meeting room ── */}
                  {isInCabin && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{
                        fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                        letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        📨 Ping Colleagues to Join
                        <span style={{
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: 20, padding: '1px 7px', fontSize: '11px', color: 'var(--accent)',
                        }}>
                          {lobbyUsersToInvite.length} available
                        </span>
                      </div>
                      {lobbyUsersToInvite.length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                          🎉 Everyone's already in a meeting — the floor is empty!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {lobbyUsersToInvite.map((u: User) => (
                            <div key={u.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 14px', background: 'var(--bg-card)',
                              border: '1px solid var(--border)', borderRadius: 12,
                            }}>
                              <span style={{ fontSize: '1.4rem' }}>{AVATAR_MAP[u.avatar] || '👤'}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.username}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At their desk 💻</div>
                              </div>
                              <button className="btn btn-primary btn-sm" onClick={() => inviteUser(u.id)}>
                                📨 Ping
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open floor: other meeting rooms */}
                  {!isInCabin && (
                    <div style={{ marginTop: '32px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        📅 Active Meeting Rooms
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
                                  {mem.length} {mem.length === 1 ? 'colleague' : 'colleagues'}
                                  {room.is_private ? ' • Private 🔒' : ''}
                                </div>
                                {mem.slice(0, 3).map((u: User) => (
                                  <span key={u.id} style={{ fontSize: '1rem', marginRight: '2px' }}>
                                    {AVATAR_MAP[u.avatar] || '👤'}
                                  </span>
                                ))}
                              </div>
                            )
                          })}
                        {Object.values(rooms).filter((r: Room) => r.id !== ROOM_ID.LOBBY).length === 0 && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No active meetings right now — book one from the sidebar! 📅
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lobby: ambient "office background music" selector */}
                  {!isInCabin && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        🎵 Office Ambience
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
                            ⏹ Silence
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Panel — Chat / Friends / AI tabs */}
            {(showChat || showAIPanel) && (
              <div style={{
                width: 300, flexShrink: 0, borderLeft: '1px solid rgba(245,158,11,0.1)',
                background: 'rgba(8,12,22,0.85)', display: 'flex', flexDirection: 'column',
              }} className="desktop-only">
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  {[
                    { key: 'chat', label: '💬 Chat' },
                    { key: 'friends', label: '👥 Colleagues' },
                    { key: 'ai', label: '🤖 AI' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveRightTab(tab.key as any)}
                      style={{
                        flex: 1, padding: '10px 4px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: '11px', fontWeight: activeRightTab === tab.key ? 700 : 500,
                        color: activeRightTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                        borderBottom: activeRightTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'all 0.15s', fontFamily: 'var(--font-base)',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {activeRightTab === 'chat' && (
                    <ChatPanel send={send} roomId={currentRoomId} onToggleEmoji={toggleEmojiPanel} />
                  )}
                  {activeRightTab === 'friends' && (
                    <FriendsPanel
                      myDbUserId={dbUser?.id ?? null}
                      currentOnlineIds={Object.keys(users)}
                      onPingUser={(userId, name) => {
                        inviteUser(userId)
                        toast.success(`📨 Ping sent to ${name}!`)
                      }}
                    />
                  )}
                  {activeRightTab === 'ai' && (
                    <AvatarChat roomId={currentRoomId} />
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowMobileSidebar(true)}>☰ Rooms</button>
        <button className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleChat}>💬 Chat</button>
        <button className={`btn btn-sm ${showAIPanel ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleAIPanel}>🤖 AI</button>
        <button className={`btn btn-sm ${isMuted ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleMute}>{isMuted ? '🔇' : '🎤'}</button>
        <button className="btn btn-sm btn-danger" style={{ fontSize: '11px' }} onClick={() => setShowClockOut(true)}>🔴 Out</button>
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
