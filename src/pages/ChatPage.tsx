import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import AvatarDisplay from '../components/chat/AvatarDisplay'
import AgentStatusPanel from '../components/chat/AgentStatusPanel'
import { MessageSquare, AlertCircle, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    setError 
  } = useChatStore()
  
  const { currentPersona, fetchDefaultPersona } = usePersonaStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Load default persona on mount
  useEffect(() => {
    fetchDefaultPersona()
  }, [])
  
  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Auto-close sidebar on mobile/tablet
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <div className="h-screen flex flex-col bg-background dark:bg-dark-background">
      {/* Header */}
      <div className="glass-strong border-b border-gray-200 dark:border-dark-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
            aria-label="Toggle sidebar"
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-text dark:text-white" />
            ) : (
              <Menu className="w-5 h-5 text-text dark:text-white" />
            )}
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text dark:text-white truncate">
              AI Chat
            </h1>
            <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
              Powered by Ollama • {currentPersona?.ai_name || 'Lycus'} Persona
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Backdrop overlay for mobile/tablet */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>
        
        {/* Left sidebar - Avatar & Status */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'w-80 border-r border-gray-200 dark:border-dark-border p-4 space-y-4 overflow-y-auto bg-white dark:bg-dark-background',
                isMobile && 'fixed left-0 top-[88px] bottom-0 z-50 shadow-2xl'
              )}
            >
              <AvatarDisplay isThinking={loading} />
              <AgentStatusPanel loading={loading} />
            </motion.aside>
          )}
        </AnimatePresence>
        
        {/* Center - Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 sm:py-12"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text dark:text-white mb-2">
                  Mulai Percakapan Baru
                </h2>
                <p className="text-sm sm:text-base text-text-secondary dark:text-gray-400 max-w-md mx-auto px-4">
                  {currentPersona?.sample_greeting || 'Halo! Saya Lycus, asisten AI Anda. Tanyakan apa saja tentang coding, tools, atau hal lainnya.'}
                </p>
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
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                      Error
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300 break-words">
                      {error}
                    </p>
                    <button
                      onClick={() => setError(null)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
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
          
          {/* Input area */}
          <ChatInput 
            onSend={sendMessage}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
