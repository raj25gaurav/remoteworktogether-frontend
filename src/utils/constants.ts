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
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN servers — required for audio/video to work through NAT on the internet
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
