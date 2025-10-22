/**
 * API Utilities - Backend health checks and connection management
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  ready: boolean
  timestamp: string
  components?: {
    database: string
    rag_system: string
    orchestrator: string
    ollama: string
  }
  components_error?: string
}

/**
 * Check if backend is ready to accept requests
 * @param timeout - Maximum time to wait in ms (default: 5000)
 * @param retries - Number of retry attempts (default: 3)
 */
export async function waitForBackendReady(
  timeout: number = 5000,
  retries: number = 3
): Promise<boolean> {
  const startTime = Date.now()
  let attempt = 0

  while (attempt < retries) {
    try {
      const response = await axios.get<HealthCheckResponse>(
        `${API_BASE_URL}/health`,
        { timeout: 2000 }
      )

      // Check if backend is ready
      if (response.data.ready && response.data.status === 'healthy') {
        console.log('✅ Backend is ready!')
        return true
      }

      // If degraded, log warning but continue
      if (response.data.status === 'degraded') {
        console.warn('⚠️ Backend is degraded:', response.data)
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.error('❌ Backend readiness timeout')
        return false
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempt++
    } catch (error) {
      console.warn(`⚠️ Health check attempt ${attempt + 1}/${retries} failed:`, error)
      
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.error('❌ Backend readiness timeout')
        return false
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempt++
    }
  }

  return false
}

/**
 * Quick health check without waiting
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse | null> {
  try {
    const response = await axios.get<HealthCheckResponse>(
      `${API_BASE_URL}/health`,
      { timeout: 2000 }
    )
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    return null
  }
}

/**
 * Get detailed system status from /api/chat/status
 */
export async function getChatSystemStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chat/status`)
    return response.data
  } catch (error) {
    console.error('Failed to get chat system status:', error)
    return null
  }
}
