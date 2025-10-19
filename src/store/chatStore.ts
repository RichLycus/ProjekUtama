import { create } from 'zustand'
import axios from 'axios'

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
  created_at: string
  updated_at: string
}

interface ChatStore {
  // State
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  loadHistory: (conversationId: string) => Promise<void>
  loadConversations: () => Promise<Conversation[]>
  createNewConversation: () => void
  clearChat: () => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  
  // Send message action
  sendMessage: async (content: string) => {
    if (!content.trim()) return
    
    set({ loading: true, error: null })
    
    try {
      const { currentConversation } = get()
      
      // Call backend API
      const response = await axios.post(`${API_BASE_URL}/api/chat/message`, {
        conversation_id: currentConversation?.id || null,
        content: content.trim(),
        role: 'user'
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
  }
}))
