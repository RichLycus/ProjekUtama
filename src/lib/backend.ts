/**
 * Backend API Configuration
 * 
 * In Electron app, backend always runs at localhost:8001 (auto-started by main process)
 * This file provides a single source of truth for backend URL
 */

// Backend URL for Electron app
export const BACKEND_URL = 'http://127.0.0.1:8001'

// Backend API endpoints
export const API_ENDPOINTS = {
  // Tools
  BACKEND_URL: BACKEND_URL,
  TOOLS: `${BACKEND_URL}/api/tools`,
  tools: {
    list: `${BACKEND_URL}/api/tools`,
    upload: `${BACKEND_URL}/api/tools/upload`,
    uploadFrontend: `${BACKEND_URL}/api/tools/upload-frontend`,
    get: (id: string) => `${BACKEND_URL}/api/tools/${id}`,
    execute: (id: string) => `${BACKEND_URL}/api/tools/${id}/execute`,
    toggle: (id: string) => `${BACKEND_URL}/api/tools/${id}/toggle`,
    delete: (id: string) => `${BACKEND_URL}/api/tools/${id}`,
    validate: (id: string) => `${BACKEND_URL}/api/tools/${id}/validate`,
    installDeps: (id: string) => `${BACKEND_URL}/api/tools/${id}/install-deps`,
    dependencies: (id: string) => `${BACKEND_URL}/api/tools/${id}/dependencies`,
    installPythonDeps: (id: string) => `${BACKEND_URL}/api/tools/${id}/install-python-deps`,
    installNodeDeps: (id: string) => `${BACKEND_URL}/api/tools/${id}/install-node-deps`,
    installAllDeps: (id: string) => `${BACKEND_URL}/api/tools/${id}/install-all-deps`,
    logs: (id: string) => `${BACKEND_URL}/api/tools/${id}/logs`,
    categories: `${BACKEND_URL}/api/tools/categories`,
  },
  
  // System
  system: {
    restart: `${BACKEND_URL}/api/system/restart`,
  },
  
  // Agents
  agents: {
    configs: `${BACKEND_URL}/api/agents/configs`,
    toggle: (id: string) => `${BACKEND_URL}/api/agents/configs/${id}/toggle`,
    update: (id: string) => `${BACKEND_URL}/api/agents/configs/${id}`,
  },
  
  // AI Chat (Phase 3)
  chat: {
    send: `${BACKEND_URL}/api/chat/send`,
    history: `${BACKEND_URL}/api/chat/history`,
  },
  
  // Games (Phase 5)
  games: {
    list: `${BACKEND_URL}/api/games`,
  },
}

// Helper function to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  } catch (error) {
    console.error('[Backend] Health check failed:', error)
    return false
  }
}

// Helper function to make API calls with error handling
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}: ${response.statusText}`,
      }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('[API] Request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
