import React, { useEffect, useRef, useState } from 'react'
import { useStore, type AppState, type User } from '../../store/useStore'
import { ROLE, AI_EMOTION, type Role, type AIEmotion } from '../../types/enums'
import { aiApi } from '../../services'

interface AIMessage {
    role: Role
    content: string
    emotion?: AIEmotion
}

const ARIA_EMOTIONS: Record<AIEmotion, string> = {
    [AI_EMOTION.HAPPY]: '🤗',
    [AI_EMOTION.LAUGHING]: '😂',
    [AI_EMOTION.EXCITED]: '🤩',
    [AI_EMOTION.THINKING]: '🤔',
    [AI_EMOTION.EMPATHETIC]: '🥺',
    [AI_EMOTION.CONFUSED]: '😵',
    [AI_EMOTION.COOL]: '😎',
}

export default function AvatarChat({ roomId }: { roomId: string }) {
    const [messages, setMessages] = useState<AIMessage[]>([
        { role: ROLE.ASSISTANT, content: "Hey there! 👋 I'm Aria, your virtual office companion! I'm here to make your remote work day brighter. Ask me anything or just say hi! 🌟", emotion: AI_EMOTION.HAPPY },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentEmotion, setCurrentEmotion] = useState<AIEmotion>(AI_EMOTION.HAPPY)
    const [suggestions, setSuggestions] = useState(['Tell me a joke 🎭', 'Team check-in 👥', 'Work tip 💡'])
    const chatEndRef = useRef<HTMLDivElement>(null)

    const myUser = useStore((s: AppState) => s.myUser)
    const users = useStore((s: AppState) => s.users)
    const rooms = useStore((s: AppState) => s.rooms)

    const room = rooms[roomId]
    const roomMembers = Object.values(users)
        .filter((u: User) => u.room_id === roomId)
        .map((u: User) => u.username)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return
        const userMsg: AIMessage = { role: ROLE.USER, content: text }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
            const data = await aiApi.chat({
                message: text,
                context: {
                    user_id: myUser?.id ?? 'unknown',
                    username: myUser?.username ?? 'User',
                    room_id: roomId,
                    room_name: room?.name ?? 'the office',
                    room_members: roomMembers,
                    conversation_history: history,
                },
            })
            const aiMsg: AIMessage = {
                role: ROLE.ASSISTANT,
                content: data.response,
                emotion: data.emotion as AIEmotion,
            }
            setMessages((prev) => [...prev, aiMsg])
            setCurrentEmotion((data.emotion as AIEmotion) || AI_EMOTION.HAPPY)
            if (data.suggestions?.length) setSuggestions(data.suggestions)
        } catch (e) {
            setMessages((prev) => [...prev, {
                role: ROLE.ASSISTANT,
                content: "Oops! I lost my connection for a sec 🌐 Try again?",
                emotion: AI_EMOTION.CONFUSED,
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-80 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* Aria Avatar Header */}
            <header className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex flex-col items-center text-center">
                    <div className="text-5xl mb-2">
                        {ARIA_EMOTIONS[currentEmotion as AIEmotion] || ARIA_EMOTIONS[AI_EMOTION.HAPPY]}
                    </div>
                    <div className="text-base font-semibold text-slate-900 dark:text-white mb-1">Aria</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        AI Office Companion
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Online & Ready
                        </span>
                    </div>
                </div>
            </header>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col gap-1 ${
                            msg.role === ROLE.USER ? 'items-end' : 'items-start'
                        }`}
                    >
                        {msg.role === ROLE.ASSISTANT && (
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                Aria {ARIA_EMOTIONS[(msg.emotion as AIEmotion) || AI_EMOTION.HAPPY]}
                            </div>
                        )}
                        <div
                            className={`text-sm leading-relaxed px-3 py-2 rounded-lg max-w-[85%] break-words ${
                                msg.role === ROLE.USER
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-1">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Aria</div>
                        <div className="bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                            <div className="flex gap-1.5 items-center">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-wrap">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Chat with Aria..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                />
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                >
                    ➤
                </button>
            </div>
        </div>
    )
}
