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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-[400px] max-h-[500px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
                <button
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        tab === TAB_TYPE.EMOJI
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    onClick={() => handleTabChange(TAB_TYPE.EMOJI)}
                >
                    😄 Emojis
                </button>
                <button
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        tab === TAB_TYPE.GIF
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    onClick={() => handleTabChange(TAB_TYPE.GIF)}
                >
                    🎬 GIFs
                </button>
                <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            {tab === TAB_TYPE.EMOJI ? (
                <>
                    {/* Emoji categories */}
                    <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                    emojiCategory === cat
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                                onClick={() => setEmojiCategory(cat as EmojiCategory)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="grid grid-cols-8 gap-1">
                            {(EMOJI_CATEGORIES[emojiCategory] || []).map((emoji) => (
                                <button
                                    key={emoji}
                                    className="w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => { onSend(emoji, TAB_TYPE.EMOJI); onClose() }}
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* GIF search */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="Search GIFs..."
                                value={gifSearch}
                                onChange={(e) => setGifSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchGifs(gifSearch)}
                            />
                            <button
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                                onClick={() => searchGifs(gifSearch)}
                            >
                                🔍
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingGifs ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                                <div className="spinner mb-3" />
                                <div className="text-sm">Loading GIFs...</div>
                            </div>
                        ) : gifError ? (
                            <div className="p-5 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {gifError}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 p-3">
                                {gifs.map((gif) => {
                                    const url = gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url
                                    const preview = gif.media_formats?.tinygif?.url || url
                                    if (!url) return null
                                    return (
                                        <div
                                            key={gif.id}
                                            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all bg-slate-100 dark:bg-slate-700"
                                            onClick={() => { onSend(url, TAB_TYPE.GIF); onClose() }}
                                        >
                                            <img
                                                src={preview}
                                                alt={gif.content_description || 'GIF'}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
