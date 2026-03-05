// In production (Vercel), set VITE_BACKEND_URL to your Railway URL
// e.g. https://remoteworktogether-backend.up.railway.app
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

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

export const STUN_SERVERS = {
    iceServers: [
        // Robust list of free STUN servers to help discover IPs across standard routers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Cloudflare's incredibly fast global STUN server
        { urls: 'stun:stun.cloudflare.com:3478' },

        // Free TURN servers — REQUIRED for strict NATs/Firewalls
        // NOTE: Free TURN servers are notoriously unreliable. If video still fails
        // across different networks, you MUST replace these with a paid service 
        // like Twilio Network Traversal or Metered.ca with a real API key.
        {
            urls: 'turn:open.relay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:open.relay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:open.relay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
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
