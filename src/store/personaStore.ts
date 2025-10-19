import { create } from 'zustand'
import toast from 'react-hot-toast'

export interface PersonalityTraits {
  technical: number
  friendly: number
  direct: number
  creative: number
  professional: number
}

export interface Persona {
  id: string
  name: string
  ai_name: string
  ai_nickname: string
  user_greeting: string
  personality_traits: PersonalityTraits
  response_style: string
  tone: string
  sample_greeting: string
  avatar_color: string
  is_default: number
  created_at: string
  updated_at: string
}

interface PersonaStore {
  personas: Persona[]
  currentPersona: Persona | null
  loading: boolean
  
  // Actions
  fetchPersonas: () => Promise<void>
  fetchDefaultPersona: () => Promise<void>
  createPersona: (data: Partial<Persona>) => Promise<boolean>
  updatePersona: (id: string, data: Partial<Persona>) => Promise<boolean>
  deletePersona: (id: string) => Promise<boolean>
  setDefaultPersona: (id: string) => Promise<boolean>
  setCurrentPersona: (persona: Persona) => void
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

export const usePersonaStore = create<PersonaStore>((set, get) => ({
  personas: [],
  currentPersona: null,
  loading: false,

  fetchPersonas: async () => {
    set({ loading: true })
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas`)
      const data = await response.json()
      
      if (data.success) {
        set({ personas: data.personas })
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error)
      toast.error('Failed to load personas')
    } finally {
      set({ loading: false })
    }
  },

  fetchDefaultPersona: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/default`)
      const data = await response.json()
      
      if (data.success) {
        set({ currentPersona: data.persona })
      }
    } catch (error) {
      console.error('Failed to fetch default persona:', error)
      // Set fallback to Lycus if API fails
      const fallbackPersona: Persona = {
        id: 'fallback-lycus',
        name: 'Lycus',
        ai_name: 'Lycus',
        ai_nickname: 'Ly',
        user_greeting: 'Kawan',
        personality_traits: {
          technical: 90,
          friendly: 70,
          direct: 85,
          creative: 60,
          professional: 75
        },
        response_style: 'technical',
        tone: 'direct',
        sample_greeting: 'Halo kawan! Saya Lycus, siap membantu.',
        avatar_color: 'purple',
        is_default: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      set({ currentPersona: fallbackPersona })
    }
  },

  createPersona: async (data) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Persona created successfully!')
        await get().fetchPersonas()
        return true
      } else {
        toast.error(result.detail || 'Failed to create persona')
        return false
      }
    } catch (error) {
      console.error('Failed to create persona:', error)
      toast.error('Failed to create persona')
      return false
    }
  },

  updatePersona: async (id, data) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Persona updated successfully!')
        await get().fetchPersonas()
        return true
      } else {
        toast.error(result.detail || 'Failed to update persona')
        return false
      }
    } catch (error) {
      console.error('Failed to update persona:', error)
      toast.error('Failed to update persona')
      return false
    }
  },

  deletePersona: async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Persona deleted successfully!')
        await get().fetchPersonas()
        return true
      } else {
        toast.error(result.detail || 'Failed to delete persona')
        return false
      }
    } catch (error) {
      console.error('Failed to delete persona:', error)
      toast.error('Failed to delete persona')
      return false
    }
  },

  setDefaultPersona: async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/${id}/default`, {
        method: 'PUT'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Default persona updated!')
        await get().fetchPersonas()
        await get().fetchDefaultPersona()
        return true
      } else {
        toast.error(result.detail || 'Failed to set default persona')
        return false
      }
    } catch (error) {
      console.error('Failed to set default persona:', error)
      toast.error('Failed to set default persona')
      return false
    }
  },

  setCurrentPersona: (persona) => {
    set({ currentPersona: persona })
  }
}))
