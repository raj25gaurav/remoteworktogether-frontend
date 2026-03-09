// In production (Vercel), set VITE_BACKEND_URL to your Railway URL
// e.g. https://remoteworktogether-backend.up.railway.app
let bUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
if (bUrl.endsWith('/')) bUrl = bUrl.slice(0, -1)
const BACKEND_URL = bUrl

// Automatically use wss:// for https:// backends (required for production)
export const WS_URL = BACKEND_URL
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://') + '/ws'

export const API_URL = BACKEND_URL

export const AVATAR_MAP: Record<string, string> = {
    astronaut: '👨‍🚀',
    robot: '🤖',
    wizard: '🧙',
    ninja: '🥷',
    scientist: '👩‍🔬',
    artist: '👩‍🎨',
    gamer: '🧑‍💻',
    chef: '👨‍🍳',
}

export const STATUS_COLORS: Record<string, string> = {
    online: '#10b981',
    busy: '#f59e0b',
    away: '#94a3b8',
    focus: '#a855f7',
}

export const EMOJI_CATEGORIES: Record<string, string[]> = {
    Quick: ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💯', '🙌', '✨', '👏', '🤩'],
    Work: ['💻', '☕', '📊', '🚀', '💡', '📝', '🎯', '⚡', '🏆', '💪', '✅', '📌'],
    Fun: ['🎮', '🎸', '🍕', '🦄', '🌈', '🎪', '🎭', '🎨', '🎬', '🎤', '🍿', '🎃'],
    People: ['😀', '😎', '🤓', '😴', '🤔', '😤', '🥳', '😍', '🤯', '😱', '🤝', '👋'],
    Animals: ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐸', '🦋', '🐙', '🦄', '🐺', '🦉'],
    Food: ['🍕', '🍔', '🍜', '🍦', '☕', '🧋', '🍰', '🍩', '🌮', '🥑', '🍣', '🥂'],
    Nature: ['🌸', '🌊', '⚡', '🌙', '⭐', '🌟', '🔥', '❄️', '🌈', '🌸', '🍀', '🌺'],
    Objects: ['💎', '🎁', '🔮', '🎵', '🏆', '🎖️', '🔑', '🎀', '💌', '📱', '🖥️', '🎲'],
}

// ─── ExpressTURN Free TURN Server ───────────────────────────────────────────
// Free tier from expressturn.com — 1000 GB/month, no credit card required.
const TURN_USERNAME = '000000002088093105'
const TURN_CREDENTIAL = 'GZEd8bGf2RIJKQgNJKOjGH9xADE='
const TURN_HOST = 'free.expressturn.com:3478'

export const STUN_SERVERS = {
    iceCandidatePoolSize: 10,  // Pre-gather candidates for faster connection setup
    iceServers: [
        // STUN servers (fast, no auth, works on simple NAT)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        // ExpressTURN relay — required for CGNAT / different ISP networks
        { urls: `turn:${TURN_HOST}`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
        { urls: `turn:${TURN_HOST}?transport=tcp`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    ],
}


export const AMBIENT_SOUNDS: Record<string, { label: string; url: string; icon: string }> = {
    lofi: {
        label: 'Lo-Fi Beats',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        icon: '🎵',
    },
    rain: {
        label: 'Rain & Thunder',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        icon: '🌧️',
    },
    cafe: {
        label: 'Café Ambience',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        icon: '☕',
    },
}
