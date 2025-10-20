import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import AgentStatusModal from '../components/chat/AgentStatusModal'
import ConversationList from '../components/chat/ConversationList'
import { MessageSquare, AlertCircle, Menu, X, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [agentStatusOpen, setAgentStatusOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()
  
  // Load default persona on mount
  useEffect(() => {
    fetchDefaultPersona()
  }, [])
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])
  
  // Update chatStore when persona changes
  useEffect(() => {
    if (currentPersona) {
      setCurrentPersonaId(currentPersona.id)
    }
  }, [currentPersona, setCurrentPersonaId])
  
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

  const handleNewChat = () => {
    // Create new conversation logic
    setCurrentConversationId(undefined)
    // TODO: Clear messages and start fresh
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    // TODO: Load conversation messages
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleToggleCollapse = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed))
  }

  // Count active agents
  const activeAgentsCount = loading ? 5 : 5 // All ready
  
  // Calculate sidebar width
  const sidebarWidth = sidebarCollapsed ? 72 : 320
  
  return (
    <div className="h-screen flex flex-col bg-background dark:bg-dark-background">
      {/* Agent Status Modal */}
      <AgentStatusModal
        isOpen={agentStatusOpen}
        onClose={() => setAgentStatusOpen(false)}
        loading={loading}
      />

      {/* Compact Header - Only Toggle & Agent Status */}
      <div className="glass-strong border-b border-gray-200 dark:border-dark-border px-4 py-3 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
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

          {/* Agent Status Button */}
          <button
            onClick={() => setAgentStatusOpen(true)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
            data-testid="agent-status-button"
            title="Agent Status"
          >
            <Activity className="w-5 h-5 text-text dark:text-white" />
            {/* Badge */}
            <span className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center',
              loading ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
            )}>
              {activeAgentsCount}
            </span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
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
        
        {/* Left sidebar - Conversation History */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: isMobile ? -sidebarWidth : 0, width: sidebarWidth }}
              animate={{ x: 0, width: sidebarWidth }}
              exit={{ x: isMobile ? -sidebarWidth : 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-background',
                isMobile && 'fixed left-0 top-[88px] bottom-0 z-50 shadow-2xl'
              )}
              style={{ width: isMobile ? 320 : sidebarWidth }}
            >
              <ConversationList
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                collapsed={!isMobile && sidebarCollapsed}
                onToggleCollapse={!isMobile ? handleToggleCollapse : undefined}
              />
            </motion.aside>
          )}
        </AnimatePresence>
        
        {/* Center - Chat area */}
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
