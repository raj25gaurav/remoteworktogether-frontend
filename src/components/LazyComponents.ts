/**
 * Lazy-loaded Components
 * Code-splitting for better performance and smaller initial bundle
 */

import { lazy } from 'react'

// Lazy load heavy components that aren't needed immediately
export const EmojiPanel = lazy(() => import('./EmojiPanel/EmojiPanel'))
export const AvatarChat = lazy(() => import('./AvatarChat/AvatarChat'))
export const VideoGrid = lazy(() => import('./VideoGrid/VideoGrid'))
