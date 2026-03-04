/**
 * External APIs Service
 * Handles third-party API integrations (Tenor GIFs, etc.)
 */

import axios, { AxiosInstance } from 'axios'

// ============================================================================
// Tenor GIF API Configuration
// ============================================================================

const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPzpG6wFwKcJONaA' // Free public demo key
const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2'

const tenorClient: AxiosInstance = axios.create({
  baseURL: TENOR_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptors for Tenor API
tenorClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`🎬 [Tenor API Request] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error('❌ [Tenor API Request Error]', error)
    return Promise.reject(error)
  }
)

tenorClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ [Tenor API Response] ${response.config.url}`, response.data)
    }
    return response
  },
  (error) => {
    console.error('❌ [Tenor API Error]', error.message)
    return Promise.reject(error)
  }
)

// ============================================================================
// Type Definitions
// ============================================================================

export interface TenorGif {
  id: string
  title?: string
  content_description?: string
  media_formats: {
    gif?: { url: string }
    mediumgif?: { url: string }
    tinygif?: { url: string }
    [key: string]: any
  }
}

export interface TenorResponse {
  results: TenorGif[]
  next?: string
}

// ============================================================================
// Tenor API Methods
// ============================================================================

export const tenorApi = {
  /**
   * Get trending GIFs
   */
  getTrending: async (limit: number = 12): Promise<TenorGif[]> => {
    try {
      const response = await tenorClient.get<TenorResponse>('/featured', {
        params: {
          key: TENOR_API_KEY,
          limit,
          media_filter: 'gif',
        },
      })
      return response.data.results
    } catch (error) {
      console.error('Failed to fetch trending GIFs:', error)
      throw new Error('Could not load GIFs. Check your connection.')
    }
  },

  /**
   * Search GIFs by query
   */
  search: async (query: string, limit: number = 12): Promise<TenorGif[]> => {
    try {
      const response = await tenorClient.get<TenorResponse>('/search', {
        params: {
          key: TENOR_API_KEY,
          q: query,
          limit,
          media_filter: 'gif',
        },
      })
      return response.data.results
    } catch (error) {
      console.error('Failed to search GIFs:', error)
      throw new Error('Could not load GIFs. Check your connection.')
    }
  },
}

// ============================================================================
// Export all external APIs
// ============================================================================

export const externalApis = {
  tenor: tenorApi,
}
