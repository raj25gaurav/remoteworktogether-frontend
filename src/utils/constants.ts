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

// ─── TURN Server Credentials ────────────────────────────────────────────────
// The free "openrelayproject" credentials are demo-only and fail under CGNAT
// (100.64.x.x IPs = your ISP is using Carrier-Grade NAT → STUN cannot help).
//
// TO FIX VIDEO ACROSS DIFFERENT NETWORKS:
// 1. Sign up FREE at: https://app.metered.ca/signup  (no credit card needed)
// 2. Create an App → go to "TURN Credentials" in the dashboard
// 3. Replace TURN_USERNAME and TURN_CREDENTIAL below with your real values
// 4. Commit and push — done!
//
const TURN_USERNAME = 'openrelayproject'    // ← Replace with your Metered.ca username
const TURN_CREDENTIAL = 'openrelayproject'  // ← Replace with your Metered.ca credential

export const STUN_SERVERS = {
    iceCandidatePoolSize: 10,  // Pre-gather candidates for faster connection setup
    iceServers: [
        // STUN (works for simple home NAT, fails with CGNAT)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        // TURN relay (REQUIRED for CGNAT / separate ISP networks)
        { urls: 'turn:open.relay.metered.ca:80', username: TURN_USERNAME, credential: TURN_CREDENTIAL },
        { urls: 'turn:open.relay.metered.ca:80?transport=tcp', username: TURN_USERNAME, credential: TURN_CREDENTIAL },
        { urls: 'turn:open.relay.metered.ca:443', username: TURN_USERNAME, credential: TURN_CREDENTIAL },
        { urls: 'turn:open.relay.metered.ca:443?transport=tcp', username: TURN_USERNAME, credential: TURN_CREDENTIAL },
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
