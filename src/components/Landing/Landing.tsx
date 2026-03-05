import React, { useState } from 'react'
import { useStore, type AppState } from '../../store/useStore'
import { AVATAR_MAP } from '../../utils/constants'
import { AVATAR_KEY, type AvatarKey } from '../../types/enums'
import { userApi } from '../../services'

const AVATARS = Object.entries(AVATAR_MAP)

export default function Landing() {
    const [username, setUsername] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>(AVATAR_KEY.ASTRONAUT)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const setMyUser = useStore((s: AppState) => s.setMyUser)

    const handleJoin = async () => {
        if (!username.trim()) {
            setError('Please enter your name to check in')
            return
        }
        setLoading(true)
        setError('')
        try {
            const data = await userApi.join(username.trim(), selectedAvatar)
            if (data.user) {
                setMyUser(data.user)
            } else {
                setError('Failed to check in. Please try again.')
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Cannot connect to the office. Is the server running?')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative">
            <div className="animated-bg" />
            
            <div className="w-full max-w-md relative z-10">
                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-[slide-in-up_0.3s_ease]">
                    {/* Logo/Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-3xl">🏢</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Check In
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Welcome to your virtual office
                        </p>
                    </div>

                    {/* Username input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            maxLength={30}
                            autoFocus
                        />
                    </div>

                    {/* Avatar selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Choose Avatar
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {AVATARS.map(([key, emoji]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedAvatar(key as AvatarKey)}
                                    className={`aspect-square rounded-lg border-2 transition-all ${
                                        selectedAvatar === key
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-md'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <span className="text-2xl">{emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="button"
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="spinner" />
                                <span>Checking in...</span>
                            </>
                        ) : (
                            <>
                                <span>✓</span>
                                <span>Clock In</span>
                            </>
                        )}
                    </button>

                    {/* Features */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: '🏢', label: 'Office' },
                                { icon: '🚪', label: 'Rooms' },
                                { icon: '💬', label: 'Chat' },
                            ].map((f) => (
                                <div
                                    key={f.label}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                                >
                                    <span className="text-lg">{f.icon}</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
