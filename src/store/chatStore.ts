import { create } from 'zustand'
import axios from 'axios'
import { waitForBackendReady } from '../lib/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agent_tag?: string
  execution_log?: {
    router?: string
    rag?: string
    execution?: string
    reasoning?: string
    persona?: string
  }
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  persona: string
  mode?: 'flash' | 'pro'  // Chat mode
  created_at: string
  updated_at: string
}

interface ChatStore {
  // State
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
  currentPersonaId: string | null  // Track current persona
  currentMode: 'flash' | 'pro'  // Track current mode
  
  // Actions
  sendMessage: (content: string, personaId?: string, mode?: 'flash' | 'pro') => Promise<void>
  loadHistory: (conversationId: string) => Promise<void>
  loadConversations: () => Promise<Conversation[]>
  createNewConversation: () => void
  clearChat: () => void
  setError: (error: string | null) => void
  setCurrentPersonaId: (personaId: string | null) => void
  setCurrentMode: (mode: 'flash' | 'pro') => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  currentPersonaId: null,
  currentMode: 'flash',  // Default mode
  
  // Send message action
  sendMessage: async (content: string, personaId?: string, mode?: 'flash' | 'pro') => {
    if (!content.trim()) return
    
    set({ loading: true, error: null })
    
    try {
      const { currentConversation, currentPersonaId, currentMode } = get()
      
      // Use provided personaId or fall back to currentPersonaId
      const effectivePersonaId = personaId || currentPersonaId
      
      // Use provided mode or fall back to currentMode
      const effectiveMode = mode || currentMode
      
      // Wait for backend to be ready (with 10s timeout)
      const isReady = await waitForBackendReady(10000, 5)
      if (!isReady) {
        throw new Error('Backend is not ready. Please wait a moment and try again.')
      }
      
      // Call backend API with persona_id and mode
      const response = await axios.post(`${API_BASE_URL}/api/chat/message`, {
        conversation_id: currentConversation?.id || null,
        content: content.trim(),
        role: 'user',
        persona_id: effectivePersonaId,  // Send persona_id to backend
        mode: effectiveMode  // Send mode to backend
      })
      
      const aiMessage: Message = response.data
      
      // If this was a new conversation, set it
      if (!currentConversation) {
        // Fetch the conversation details
        const convResponse = await axios.get(`${API_BASE_URL}/api/chat/conversation/${aiMessage.conversation_id}`)
        set({ currentConversation: convResponse.data })
      }
      
      // Add user message and AI response to messages
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: aiMessage.conversation_id,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      }
      
      set(state => ({
        messages: [...state.messages, userMessage, aiMessage],
        loading: false
      }))
      
    } catch (error: any) {
      console.error('Failed to send message:', error)
      set({ 
        error: error.response?.data?.detail || 'Failed to send message',
        loading: false 
      })
    }
  },
  
  // Load conversation history
  loadHistory: async (conversationId: string) => {
    set({ loading: true, error: null })
    
    try {
      const [messagesResponse, conversationResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/chat/history/${conversationId}`),
        axios.get(`${API_BASE_URL}/api/chat/conversation/${conversationId}`)
      ])
      
      set({
        messages: messagesResponse.data,
        currentConversation: conversationResponse.data,
        loading: false
      })
    } catch (error: any) {
      console.error('Failed to load history:', error)
      set({ 
        error: error.response?.data?.detail || 'Failed to load conversation',
        loading: false 
      })
    }
  },
  
  // Load all conversations
  loadConversations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/conversations`)
      return response.data
    } catch (error: any) {
      console.error('Failed to load conversations:', error)
      return []
    }
  },
  
  // Create new conversation
  createNewConversation: () => {
    set({
      currentConversation: null,
      messages: [],
      error: null
    })
  },
  
  // Clear chat
  clearChat: () => {
    set({
      currentConversation: null,
      messages: [],
      error: null
    })
  },
  
  // Set error
  setError: (error: string | null) => {
    set({ error })
  },
  
  // Set current persona
  setCurrentPersonaId: (personaId: string | null) => {
    set({ currentPersonaId: personaId })
  },
  
  // Set current mode
  setCurrentMode: (mode: 'flash' | 'pro') => {
    set({ currentMode: mode })
  }
}))
