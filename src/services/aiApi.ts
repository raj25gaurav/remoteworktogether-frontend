/**
 * AI/Avatar API Service
 * Handles all AI assistant chat requests
 */

import { http } from './httpClient'
import type { Role } from '../types/enums'

// ============================================================================
// Type Definitions
// ============================================================================

export interface AIChatRequest {
  message: string
  context: {
    room_name?: string
    members?: string[]
    username?: string
    user_id?: string
    room_id?: string
    room_members?: string[]
    conversation_history?: Array<{ role: string; content: string }>
    [key: string]: any  // Allow additional context fields
  }
}

export interface AIChatResponse {
  response: string
  emotion?: string
  suggestions?: string[]
}

// ============================================================================
// AI API Methods
// ============================================================================

export const aiApi = {
  /**
   * Send a chat message to the AI assistant
   */
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    try {
      const response = await http.post<AIChatResponse>('/api/avatar/chat', request)
      return response
    } catch (error) {
      console.error('AI chat request failed:', error)
      // Return fallback response
      return {
        response: "Oops! I lost my connection for a sec 🌐 Try again?",
        emotion: 'confused',
        suggestions: ['Try again', 'Help', 'Tell me a joke'],
      }
    }
  },
}
