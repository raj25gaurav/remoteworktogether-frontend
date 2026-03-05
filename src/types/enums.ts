/**
 * Enterprise-level type-safe enums and constants
 * Centralized to prevent typos and ensure consistency
 */

// ============================================================================
// User Status
// ============================================================================
export const USER_STATUS = {
  ONLINE: 'online',
  BUSY: 'busy',
  AWAY: 'away',
  FOCUS: 'focus',
} as const

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]

export const USER_STATUS_CONFIG = {
  [USER_STATUS.ONLINE]: { label: 'In Office', color: '#10b981', icon: '🟢' },
  [USER_STATUS.BUSY]: { label: 'In a Meeting', color: '#f59e0b', icon: '🟡' },
  [USER_STATUS.AWAY]: { label: 'OOO', color: '#94a3b8', icon: '⚪' },
  [USER_STATUS.FOCUS]: { label: 'Deep Work', color: '#a855f7', icon: '🟣' },
} as const

// ============================================================================
// Message Types
// ============================================================================
export const MESSAGE_TYPE = {
  TEXT: 'text',
  EMOJI: 'emoji',
  GIF: 'gif',
  SYSTEM: 'system',
} as const

export type MessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE]

// ============================================================================
// View Modes
// ============================================================================
export const VIEW_MODE = {
  LOBBY: 'lobby',
  VIDEO: 'video',
} as const

export type ViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE]

// ============================================================================
// Component Sizes
// ============================================================================
export const SIZE = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const

export type Size = typeof SIZE[keyof typeof SIZE]

// ============================================================================
// Reaction Animations
// ============================================================================
export const REACTION_ANIMATION = {
  FLOAT_UP: 'float-up',
  BOUNCE: 'bounce',
  SPIN: 'spin',
  PULSE: 'pulse',
  FADE_OUT: 'fade-out',
} as const

export type ReactionAnimation = typeof REACTION_ANIMATION[keyof typeof REACTION_ANIMATION]

// ============================================================================
// Tab Types (for panels)
// ============================================================================
export const TAB_TYPE = {
  EMOJI: 'emoji',
  GIF: 'gif',
} as const

export type TabType = typeof TAB_TYPE[keyof typeof TAB_TYPE]

// ============================================================================
// WebRTC Signaling Types
// ============================================================================
export const WEBRTC_MESSAGE_TYPE = {
  OFFER: 'webrtc_offer',
  ANSWER: 'webrtc_answer',
  ICE: 'webrtc_ice',
} as const

export type WebRTCMessageType = typeof WEBRTC_MESSAGE_TYPE[keyof typeof WEBRTC_MESSAGE_TYPE]

// ============================================================================
// WebSocket Message Types
// ============================================================================
export const WS_MESSAGE_TYPE = {
  // Connection
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  
  // User events
  USER_LIST: 'user_list',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  STATUS_UPDATE: 'status_update',
  
  // Room events
  ROOM_CREATE: 'room_create',
  ROOM_UPDATE: 'room_update',
  ROOM_JOIN: 'room_join',
  ROOM_LEAVE: 'room_leave',
  ROOM_INVITE: 'room_invite',
  
  // Communication
  CHAT_MESSAGE: 'chat_message',
  REACTION: 'reaction',
  
  // WebRTC
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE: 'webrtc_ice',
} as const

export type WSMessageType = typeof WS_MESSAGE_TYPE[keyof typeof WS_MESSAGE_TYPE]

// ============================================================================
// Room Types
// ============================================================================
export const ROOM_ID = {
  LOBBY: 'lobby',
} as const

export type RoomId = typeof ROOM_ID[keyof typeof ROOM_ID] | string

// ============================================================================
// Avatar Keys (reference to AVATAR_MAP in constants)
// ============================================================================
export const AVATAR_KEY = {
  ASTRONAUT: 'astronaut',
  ROBOT: 'robot',
  WIZARD: 'wizard',
  NINJA: 'ninja',
  SCIENTIST: 'scientist',
  ARTIST: 'artist',
  GAMER: 'gamer',
  CHEF: 'chef',
} as const

export type AvatarKey = typeof AVATAR_KEY[keyof typeof AVATAR_KEY]

// ============================================================================
// Ambient Sound Keys
// ============================================================================
export const AMBIENT_SOUND_KEY = {
  LOFI: 'lofi',
  RAIN: 'rain',
  CAFE: 'cafe',
} as const

export type AmbientSoundKey = typeof AMBIENT_SOUND_KEY[keyof typeof AMBIENT_SOUND_KEY]

// ============================================================================
// HTTP Methods
// ============================================================================
export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const

export type HttpMethod = typeof HTTP_METHOD[keyof typeof HTTP_METHOD]

// ============================================================================
// Connection State
// ============================================================================
export const CONNECTION_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
} as const

export type ConnectionState = typeof CONNECTION_STATE[keyof typeof CONNECTION_STATE]

// ============================================================================
// Emoji Categories (reference to EMOJI_CATEGORIES in constants)
// ============================================================================
export const EMOJI_CATEGORY = {
  QUICK: 'Quick',
  WORK: 'Work',
  FUN: 'Fun',
  PEOPLE: 'People',
  ANIMALS: 'Animals',
  FOOD: 'Food',
  NATURE: 'Nature',
  OBJECTS: 'Objects',
} as const

export type EmojiCategory = typeof EMOJI_CATEGORY[keyof typeof EMOJI_CATEGORY]

// ============================================================================
// Tenor GIF API Types
// ============================================================================
export const TENOR_REQUEST_TYPE = {
  TRENDING: 'trending',
  SEARCH: 'search',
} as const

export type TenorRequestType = typeof TENOR_REQUEST_TYPE[keyof typeof TENOR_REQUEST_TYPE]

// ============================================================================
// AI/Avatar Emotions
// ============================================================================
export const AI_EMOTION = {
  HAPPY: 'happy',
  LAUGHING: 'laughing',
  EXCITED: 'excited',
  THINKING: 'thinking',
  EMPATHETIC: 'empathetic',
  CONFUSED: 'confused',
  COOL: 'cool',
} as const

export type AIEmotion = typeof AI_EMOTION[keyof typeof AI_EMOTION]

// ============================================================================
// Role Types
// ============================================================================
export const ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export type Role = typeof ROLE[keyof typeof ROLE]
