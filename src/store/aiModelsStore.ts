import { create } from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export interface AIModel {
  id: string
  model_name: string
  display_name: string
  description: string
  is_default: number
  created_at: string
}

interface AIModelsStore {
  models: AIModel[]
  loading: boolean
  
  // Actions
  loadModels: () => Promise<void>
  addModel: (model_name: string, display_name: string, description: string) => Promise<boolean>
  updateModel: (id: string, model_name: string, display_name: string, description: string) => Promise<boolean>
  deleteModel: (id: string) => Promise<boolean>
  setDefaultModel: (id: string) => Promise<boolean>
  testModel: (model_name: string) => Promise<boolean>
}

export const useAIModelsStore = create<AIModelsStore>((set, get) => ({
  models: [],
  loading: false,
  
  // Load all models from database
  loadModels: async () => {
    set({ loading: true })
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/ai/models/list`)
      if (response.data.success) {
        set({ models: response.data.models, loading: false })
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      set({ loading: false })
    }
  },
  
  // Add new model
  addModel: async (model_name: string, display_name: string, description: string) => {
    set({ loading: true })
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/ai/models/add`, {
        model_name,
        display_name,
        description
      })
      
      if (response.data.success) {
        toast.success('✅ Model added successfully!')
        await get().loadModels() // Reload models
        set({ loading: false })
        return true
      }
      
      toast.error('❌ Failed to add model')
      set({ loading: false })
      return false
    } catch (error: any) {
      console.error('Failed to add model:', error)
      toast.error(error.response?.data?.detail || '❌ Failed to add model')
      set({ loading: false })
      return false
    }
  },
  
  // Update model
  updateModel: async (id: string, model_name: string, display_name: string, description: string) => {
    set({ loading: true })
    try {
      const response = await axios.put(`${API_BASE_URL}/api/chat/ai/models/${id}`, {
        model_name,
        display_name,
        description
      })
      
      if (response.data.success) {
        toast.success('✅ Model updated successfully!')
        await get().loadModels() // Reload models
        set({ loading: false })
        return true
      }
      
      toast.error('❌ Failed to update model')
      set({ loading: false })
      return false
    } catch (error: any) {
      console.error('Failed to update model:', error)
      toast.error(error.response?.data?.detail || '❌ Failed to update model')
      set({ loading: false })
      return false
    }
  },
  
  // Delete model
  deleteModel: async (id: string) => {
    set({ loading: true })
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/chat/ai/models/${id}`)
      
      if (response.data.success) {
        toast.success('✅ Model deleted successfully!')
        await get().loadModels() // Reload models
        set({ loading: false })
        return true
      }
      
      toast.error('❌ Failed to delete model')
      set({ loading: false })
      return false
    } catch (error: any) {
      console.error('Failed to delete model:', error)
      toast.error(error.response?.data?.detail || '❌ Failed to delete model')
      set({ loading: false })
      return false
    }
  },
  
  // Set default model
  setDefaultModel: async (id: string) => {
    const toastId = toast.loading('Setting default model...')
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/ai/models/set-default/${id}`)
      
      if (response.data.success) {
        toast.success(response.data.message, { id: toastId })
        await get().loadModels() // Reload models
        return true
      }
      
      toast.error('❌ Failed to set default model', { id: toastId })
      return false
    } catch (error: any) {
      console.error('Failed to set default:', error)
      toast.error(error.response?.data?.detail || '❌ Failed to set default model', { id: toastId })
      return false
    }
  },
  
  // Test model (check if exists in Ollama)
  testModel: async (model_name: string) => {
    const toastId = toast.loading(`Testing model: ${model_name}...`)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/ai/models/test/${encodeURIComponent(model_name)}`)
      
      if (response.data.available) {
        toast.success(response.data.message, { id: toastId, duration: 5000 })
        return true
      } else {
        toast.error(response.data.message, { id: toastId, duration: 8000 })
        return false
      }
    } catch (error: any) {
      console.error('Model test failed:', error)
      toast.error('❌ Model test failed', { id: toastId })
      return false
    }
  }
}))
