import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { AVATAR_MAP } from '../../utils/constants'
import type { ChatMessage } from '../../store/useStore'
import { MESSAGE_TYPE, WS_MESSAGE_TYPE } from '../../types/enums'

interface ChatPanelProps {
    send: (type: string, payload: any) => void
    roomId: string
    onToggleEmoji: () => void
}

function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel({ send, roomId, onToggleEmoji }: ChatPanelProps) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const allMessages = useStore((s: AppState) => s.messages)
    const messages = useMemo(() => allMessages[roomId] ?? [], [allMessages, roomId])
    const myUser = useStore((s: AppState) => s.myUser)
    const showChat = useStore((s: AppState) => s.showChat)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = (content?: string) => {
        const text = content || input.trim()
        if (!text) return
        send(WS_MESSAGE_TYPE.CHAT_MESSAGE, {
            content: text,
            room_id: roomId,
            message_type: MESSAGE_TYPE.TEXT,
        })
        setInput('')
    }

    if (!showChat) return null

    return (
        <aside className="w-80 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* Header */}
            <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-shrink-0">
                <span className="text-lg">💬</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white flex-1">Team Chat</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{messages.length}</span>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 mb-3">
                            <div className="text-xl">💬</div>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white mb-1 text-sm">No messages yet</div>
                        <div className="text-xs">Start a conversation</div>
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatMsgItem key={msg.id} msg={msg} isMe={msg.sender_id === myUser?.id} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button 
                    type="button"
                    onClick={onToggleEmoji} 
                    title="Emoji & GIF"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    😄
                </button>
                <input
                    type="text"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ➤
                </button>
            </div>
        </aside>
    )
}

function ChatMsgItem({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
    const avatarEmoji = AVATAR_MAP[msg.avatar || ''] || '👤'

    if (msg.message_type === MESSAGE_TYPE.GIF) {
        return (
            <div className="flex gap-2">
                <div className="text-lg flex-shrink-0">{avatarEmoji}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {msg.username}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div>
                        <img src={msg.content} alt="GIF" className="max-w-[200px] rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
            <div className="text-lg flex-shrink-0">{avatarEmoji}</div>
            <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {isMe ? 'You' : msg.username}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                    className={`text-sm leading-relaxed px-3 py-2 rounded-lg max-w-[80%] break-words ${
                        isMe 
                            ? 'bg-blue-500 text-white rounded-br-sm' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}
                >
                    {msg.content}
                </div>
            </div>
        </div>
    )
}
