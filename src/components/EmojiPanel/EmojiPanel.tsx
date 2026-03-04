import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { EMOJI_CATEGORIES } from '../../utils/constants'

interface EmojiPanelProps {
    onSend: (content: string, type: 'emoji' | 'gif') => void
    onClose: () => void
    tenorKey?: string
}

const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPzpG6wFwKcJONaA' // Free public demo key

export default function EmojiPanel({ onSend, onClose }: EmojiPanelProps) {
    const [tab, setTab] = useState<'emoji' | 'gif'>('emoji')
    const [emojiCategory, setEmojiCategory] = useState('Quick')
    const [gifSearch, setGifSearch] = useState('')
    const [gifs, setGifs] = useState<any[]>([])
    const [loadingGifs, setLoadingGifs] = useState(false)
    const [gifError, setGifError] = useState('')

    const searchGifs = async (query: string) => {
        if (!query.trim()) {
            // Load trending GIFs
            fetchGifs('trending', '')
            return
        }
        fetchGifs('search', query)
    }

    const fetchGifs = async (type: 'trending' | 'search', query: string) => {
        setLoadingGifs(true)
        setGifError('')
        try {
            const url = type === 'trending'
                ? `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=12&media_filter=gif`
                : `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&q=${encodeURIComponent(query)}&limit=12&media_filter=gif`
            const res = await fetch(url)
            const data = await res.json()
            if (data.results) {
                setGifs(data.results)
            } else {
                setGifError('No GIFs found. Try another search!')
            }
        } catch {
            setGifError('Could not load GIFs. Check your connection.')
        } finally {
            setLoadingGifs(false)
        }
    }

    // Load trending on GIF tab open
    const handleTabChange = (newTab: 'emoji' | 'gif') => {
        setTab(newTab)
        if (newTab === 'gif' && gifs.length === 0) {
            fetchGifs('trending', '')
        }
    }

    return (
        <div className="emoji-panel">
            {/* Header */}
            <div className="emoji-panel-header">
                <button
                    className={`btn btn-sm ${tab === 'emoji' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleTabChange('emoji')}
                >
                    😄 Emojis
                </button>
                <button
                    className={`btn btn-sm ${tab === 'gif' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleTabChange('gif')}
                >
                    🎬 GIFs
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>
                    ✕
                </button>
            </div>

            {tab === 'emoji' ? (
                <>
                    {/* Emoji categories */}
                    <div className="emoji-tabs">
                        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                className={`emoji-tab ${emojiCategory === cat ? 'active' : ''}`}
                                onClick={() => setEmojiCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="emoji-grid">
                        {(EMOJI_CATEGORIES[emojiCategory] || []).map((emoji) => (
                            <button
                                key={emoji}
                                className="emoji-btn"
                                onClick={() => { onSend(emoji, 'emoji'); onClose() }}
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* GIF search */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                                className="input"
                                style={{ padding: '7px 12px', fontSize: '13px' }}
                                placeholder="Search GIFs..."
                                value={gifSearch}
                                onChange={(e) => setGifSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchGifs(gifSearch)}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => searchGifs(gifSearch)}>
                                🔍
                            </button>
                        </div>
                    </div>

                    {loadingGifs ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div className="spinner" style={{ margin: '0 auto 10px' }} />
                            Loading GIFs...
                        </div>
                    ) : gifError ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            {gifError}
                        </div>
                    ) : (
                        <div className="gif-grid">
                            {gifs.map((gif) => {
                                const url = gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url
                                const preview = gif.media_formats?.tinygif?.url || url
                                if (!url) return null
                                return (
                                    <div
                                        key={gif.id}
                                        className="gif-item"
                                        onClick={() => { onSend(url, 'gif'); onClose() }}
                                    >
                                        <img src={preview} alt={gif.content_description || 'GIF'} loading="lazy" />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
