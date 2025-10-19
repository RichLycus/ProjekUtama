import { create } from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

interface AIConfig {
  ollama_url: string
  model: string
  default_persona: string
  context_window_size: number
  temperature: number
  execution_enabled: boolean
  execution_policy: string
  vector_db_path: string
}

interface AIConfigStore {
  config: AIConfig | null
  loading: boolean
  
  // Actions
  loadConfig: () => Promise<void>
  saveConfig: (updates: Partial<AIConfig>) => Promise<boolean>
  testConnection: () => Promise<boolean>
  listModels: () => Promise<string[]>
}

export const useAIConfigStore = create<AIConfigStore>((set, _get) => ({
  config: null,
  loading: false,
  
  // Load configuration from backend
  loadConfig: async () => {
    set({ loading: true })
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/ai/config`)
      set({ config: response.data.config, loading: false })
    } catch (error) {
      console.error('Failed to load AI config:', error)
      set({ loading: false })
    }
  },
  
  // Save configuration to backend
  saveConfig: async (updates: Partial<AIConfig>) => {
    set({ loading: true })
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/ai/config`, updates)
      
      if (response.data.success) {
        set({ config: response.data.config, loading: false })
        toast.success('✅ Settings saved successfully!')
        return true
      } else {
        toast.error('❌ Failed to save settings')
        set({ loading: false })
        return false
      }
    } catch (error: any) {
      console.error('Failed to save AI config:', error)
      toast.error('❌ Failed to save settings')
      set({ loading: false })
      return false
    }
  },
  
  // Test Ollama connection
  testConnection: async () => {
    const toastId = toast.loading('Testing Ollama connection...')
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/ai/test-connection`)
      
      if (response.data.connected) {
        toast.success(response.data.message, { id: toastId })
        return true
      } else {
        toast.error(response.data.message, { id: toastId, duration: 5000 })
        return false
      }
    } catch (error: any) {
      console.error('Connection test failed:', error)
      toast.error('❌ Connection test failed', { id: toastId })
      return false
    }
  },
  
  // List available models
  listModels: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/ai/models`)
      return response.data.models || []
    } catch (error) {
      console.error('Failed to list models:', error)
      return []
    }
  }
}))
