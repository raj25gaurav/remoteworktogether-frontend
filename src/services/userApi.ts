/**
 * User API Service
 * Handles all user-related HTTP requests
 */

import { http } from './httpClient'
import type { User } from '../store/useStore'

// ============================================================================
// Type Definitions
// ============================================================================

interface JoinResponse {
  user: User
  message?: string
}

// ============================================================================
// User API Methods
// ============================================================================

export const userApi = {
  /**
   * Join the application - create/register a user session
   */
  join: async (username: string, avatar: string): Promise<JoinResponse> => {
    try {
      const response = await http.get<JoinResponse>(
        `/api/join?username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar)}`
      )
      return response
    } catch (error) {
      console.error('Failed to join:', error)
      throw new Error('Failed to connect to server. Please check your connection.')
    }
  },
}
