/**
 * Enterprise-level HTTP Client with Axios
 * Centralized configuration with interceptors for request/response handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { API_URL } from '../utils/constants'

// ============================================================================
// HTTP Client Configuration
// ============================================================================

const httpClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ============================================================================
// Request Interceptor
// ============================================================================

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to requests for debugging
    if (import.meta.env.DEV) {
      console.log(`🚀 [HTTP Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        timestamp: new Date().toISOString(),
      })
    }

    // Add authentication token if available (future enhancement)
    // const token = localStorage.getItem('auth_token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ [HTTP Request Error]', error)
    return Promise.reject(error)
  }
)

// ============================================================================
// Response Interceptor
// ============================================================================

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in dev mode
    if (import.meta.env.DEV) {
      console.log(`✅ [HTTP Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      })
    }

    return response
  },
  (error: AxiosError) => {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      console.error(`❌ [HTTP Response Error] ${error.response.status}`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        data: error.response.data,
        timestamp: new Date().toISOString(),
      })

      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth and redirect (future enhancement)
          console.warn('⚠️ Unauthorized access - authentication required')
          break
        case 403:
          console.warn('⚠️ Forbidden - insufficient permissions')
          break
        case 404:
          console.warn('⚠️ Resource not found')
          break
        case 429:
          console.warn('⚠️ Rate limit exceeded - too many requests')
          break
        case 500:
        case 502:
        case 503:
          console.error('🔥 Server error - please try again later')
          break
        default:
          console.error('❌ Unexpected error occurred')
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('❌ [HTTP Network Error] No response received', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Error in request configuration
      console.error('❌ [HTTP Config Error]', error.message)
    }

    return Promise.reject(error)
  }
)

// ============================================================================
// HTTP Client Export
// ============================================================================

export default httpClient

// ============================================================================
// Convenience Methods
// ============================================================================

export const http = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: any) => 
    httpClient.get<T>(url, config).then((res: AxiosResponse<T>) => res.data),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: any) => 
    httpClient.post<T>(url, data, config).then((res: AxiosResponse<T>) => res.data),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: any) => 
    httpClient.put<T>(url, data, config).then((res: AxiosResponse<T>) => res.data),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: any) => 
    httpClient.patch<T>(url, data, config).then((res: AxiosResponse<T>) => res.data),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: any) => 
    httpClient.delete<T>(url, config).then((res: AxiosResponse<T>) => res.data),
}
