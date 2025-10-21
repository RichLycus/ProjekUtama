import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import { MessageSquare, AlertCircle } from 'lucide-react'

export default function ChatPage() {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    setError,
    setCurrentPersonaId 
  } = useChatStore()
  
  const { currentPersona, fetchDefaultPersona } = usePersonaStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Load default persona on mount
  useEffect(() => {
    fetchDefaultPersona()
  }, [])
  
  // Update chatStore when persona changes
  useEffect(() => {
    if (currentPersona) {
      setCurrentPersonaId(currentPersona.id)
    }
  }, [currentPersona, setCurrentPersonaId])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <div className="h-full flex flex-col bg-background dark:bg-dark-background">
      {/* Main chat area - Full height, no header */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Messages container with proper flex */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Welcome message with Avatar Card - COMPACT */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              {/* Avatar Card di chat area - COMPACT VERSION */}
              <div className="glass-strong rounded-xl p-4 border border-gray-200 dark:border-dark-border mb-4 hover:shadow-lg transition-all duration-300">
                {/* Avatar with gradient background */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-md">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-background">
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-text dark:text-white">
                      {currentPersona?.ai_name || 'Lycus AI'}
                    </h2>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      Siap membantu Anda
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Online
                    </span>
                  </div>
                </div>

                {/* Greeting - COMPACT */}
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-text dark:text-white mb-1">
                    Mulai Percakapan Baru
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-gray-400 line-clamp-2">
                    {currentPersona?.sample_greeting || 'Halo! Saya Lycus, siap membantu.'}
                  </p>
                </div>

                {/* 3D Avatar Feature - COMPACT */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500/10 to-primary/10 dark:from-purple-500/20 dark:to-primary/20 p-3 border border-purple-200 dark:border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-md">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-text dark:text-white">
                        🎬 3D Avatar - Coming Soon
                      </p>
                      <p className="text-[10px] text-text-muted dark:text-gray-500">
                        Lipsync Animation Ready
                      </p>
                    </div>
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Messages */}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              agent_tag={message.agent_tag}
              execution_log={message.execution_log}
            />
          ))}
          
          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-xl mx-auto"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">
                    Error
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 break-words">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area - Always visible, sticky at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-dark-border">
          <ChatInput 
            onSend={sendMessage}
            loading={loading}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  )
}
