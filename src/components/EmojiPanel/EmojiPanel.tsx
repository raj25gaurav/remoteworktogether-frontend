import React, { useState } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { EMOJI_CATEGORIES } from '../../utils/constants'
import { TAB_TYPE, TENOR_REQUEST_TYPE, EMOJI_CATEGORY, type TabType, type TenorRequestType, type EmojiCategory } from '../../types/enums'
import { tenorApi, type TenorGif } from '../../services'

interface EmojiPanelProps {
    onSend: (content: string, type: TabType) => void
    onClose: () => void
    tenorKey?: string
}

export default function EmojiPanel({ onSend, onClose }: EmojiPanelProps) {
    const [tab, setTab] = useState<TabType>(TAB_TYPE.EMOJI)
    const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>(EMOJI_CATEGORY.QUICK)
    const [gifSearch, setGifSearch] = useState('')
    const [gifs, setGifs] = useState<TenorGif[]>([])
    const [loadingGifs, setLoadingGifs] = useState(false)
    const [gifError, setGifError] = useState('')

    const searchGifs = async (query: string) => {
        if (!query.trim()) {
            // Load trending GIFs
            fetchGifs(TENOR_REQUEST_TYPE.TRENDING, '')
            return
        }
        fetchGifs(TENOR_REQUEST_TYPE.SEARCH, query)
    }

    const fetchGifs = async (type: TenorRequestType, query: string) => {
        setLoadingGifs(true)
        setGifError('')
        try {
            const results = type === TENOR_REQUEST_TYPE.TRENDING
                ? await tenorApi.getTrending(12)
                : await tenorApi.search(query, 12)
            
            setGifs(results)
            if (results.length === 0) {
                setGifError('No GIFs found. Try another search!')
            }
        } catch (error) {
            setGifError(error instanceof Error ? error.message : 'Could not load GIFs. Check your connection.')
        } finally {
            setLoadingGifs(false)
        }
    }

    // Load trending on GIF tab open
    const handleTabChange = (newTab: TabType) => {
        setTab(newTab)
        if (newTab === TAB_TYPE.GIF && gifs.length === 0) {
            fetchGifs(TENOR_REQUEST_TYPE.TRENDING, '')
        }
    }

    return (
        <div className="emoji-panel">
            {/* Header */}
            <div className="emoji-panel-header">
                <button
                    className={`btn btn-sm ${tab === TAB_TYPE.EMOJI ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleTabChange(TAB_TYPE.EMOJI)}
                >
                    😄 Emojis
                </button>
                <button
                    className={`btn btn-sm ${tab === TAB_TYPE.GIF ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleTabChange(TAB_TYPE.GIF)}
                >
                    🎬 GIFs
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>
                    ✕
                </button>
            </div>

            {tab === TAB_TYPE.EMOJI ? (
                <>
                    {/* Emoji categories */}
                    <div className="emoji-tabs">
                        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                className={`emoji-tab ${emojiCategory === cat ? 'active' : ''}`}
                                onClick={() => setEmojiCategory(cat as EmojiCategory)}
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
                                onClick={() => { onSend(emoji, TAB_TYPE.EMOJI); onClose() }}
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
                                        onClick={() => { onSend(url, TAB_TYPE.GIF); onClose() }}
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
