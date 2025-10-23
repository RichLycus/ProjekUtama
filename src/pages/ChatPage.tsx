import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import { useThemeStore } from '../store/themeStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import AgentInfoBadge from '../components/chat/AgentInfoBadge'
import ChatModeSelector from '../components/chat/ChatModeSelector'
import ActionCards from '../components/chat/ActionCards'
import FileManagerModal from '../components/chat/FileManagerModal'
import { MessageSquare, AlertCircle, Sparkles, Zap, Brain, FolderOpen, UserCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export default function ChatPage() {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    setError,
    setCurrentPersonaId,
    currentMode,
    setCurrentMode
  } = useChatStore()
  
  const { currentPersona, fetchDefaultPersona } = usePersonaStore()
  const { actualTheme } = useThemeStore()
  
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  
  // Mock conversation ID - In real app, this would come from chat store
  const conversationId = 'default-conversation-id'
  
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
  
  // Handle action card click (currently not pre-filling input)
  const handleActionClick = (prompt: string) => {
    // For now, just send the prompt directly
    // TODO: Implement input pre-fill if needed
    sendMessage(prompt, undefined, currentMode)
  }
  
  // Handle send with mode
  const handleSendMessage = (content: string) => {
    sendMessage(content, undefined, currentMode)
  }
  
  return (
    <div 
      className={cn(
        "h-[calc(100vh-2rem)] flex flex-col",
        actualTheme === 'dark' 
          ? "bg-dark-background" 
          : "bg-white"
      )}
    >
        {/* Top Bar - Fixed */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
          {/* Agent Info Badge - Top Left */}
          <div>
            <AgentInfoBadge />
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Personal Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Trigger global event to open modal
                window.dispatchEvent(new CustomEvent('openPersonalSettings'))
              }}
              className={cn(
                "p-2 rounded-full border shadow-md hover:shadow-lg transition-all",
                actualTheme === 'dark'
                  ? "bg-dark-surface border-gray-700 hover:bg-dark-surface-hover"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              title="Personal Settings"
              data-testid="personal-settings-button"
            >
              <UserCircle className={cn(
                "w-5 h-5",
                actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
              )} />
            </motion.button>
            
            {/* File Manager Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFileManager(true)}
              className={cn(
                "p-2 rounded-full border shadow-md hover:shadow-lg transition-all",
                actualTheme === 'dark'
                  ? "bg-dark-surface border-gray-700 hover:bg-dark-surface-hover"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              title="File Manager"
              data-testid="file-manager-button"
            >
              <FolderOpen className={cn(
                "w-5 h-5",
                actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
              )} />
            </motion.button>
            
            {/* Mode Indicator */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModeSelector(true)}
              className={cn(
                "px-4 py-2 rounded-full border shadow-md hover:shadow-lg transition-all flex items-center gap-2",
                actualTheme === 'dark'
                  ? "bg-dark-surface border-gray-700 hover:bg-dark-surface-hover"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              title="Change mode"
            >
              {currentMode === 'flash' ? (
                <>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className={cn(
                    "text-sm font-medium",
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
                  )}>
                    Flash
                  </span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className={cn(
                    "text-sm font-medium",
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
                  )}>
                    Pro
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {/* Empty State - Centered Welcome */}
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8"
            >
              {/* Logo/Avatar - Large & Centered */}
              <div className="mb-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-2xl">
                    {currentMode === 'flash' ? (
                      <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    ) : (
                      <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    )}
                  </div>
                  {/* Animated rings */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-primary/30 animate-ping" />
                  <div className="absolute inset-0 rounded-3xl border-4 border-secondary/20 animate-pulse" />
                </div>
              </div>

              {/* Welcome Text */}
              <h1 className={cn(
                "text-2xl sm:text-4xl font-bold mb-3 text-center",
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {currentPersona?.ai_name || 'ChimeraAI'}
              </h1>
              <p className={cn(
                "text-base sm:text-lg text-center mb-6 max-w-lg",
                actualTheme === 'dark' ? 'text-white/80' : 'text-gray-700'
              )}>
                {currentPersona?.sample_greeting || 'How can I help you today?'}
              </p>

              {/* Conditional UI based on mode */}
              {currentMode === 'pro' ? (
                <>
                  {/* Action Cards - Only in Pro Mode */}
                  <div className="mb-6 w-full max-w-2xl">
                    <ActionCards onActionClick={handleActionClick} />
                  </div>

                  {/* Feature Badge */}
                  <div className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm",
                    actualTheme === 'dark'
                      ? "bg-dark-surface border-gray-700"
                      : "bg-white border-gray-200"
                  )}>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className={cn(
                      "text-sm",
                      actualTheme === 'dark' ? 'text-white/80' : 'text-gray-700'
                    )}>
                      Powered by Advanced AI
                    </span>
                  </div>
                </>
              ) : (
                /* Flash Mode - Simpler UI */
                <div className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm",
                  actualTheme === 'dark'
                    ? "bg-dark-surface border-gray-700"
                    : "bg-white border-gray-200"
                )}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className={cn(
                    "text-sm",
                    actualTheme === 'dark' ? 'text-white/80' : 'text-gray-700'
                  )}>
                    Fast & Simple Mode
                  </span>
                </div>
              )}
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
          
          {/* Loading indicator with bubble animation */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 mb-4"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-primary to-secondary"
              )}>
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-3 max-w-[80%]",
                actualTheme === 'dark'
                  ? "bg-dark-surface border border-gray-700"
                  : "bg-white border border-gray-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        actualTheme === 'dark' ? 'bg-white/60' : 'bg-gray-400'
                      )}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        actualTheme === 'dark' ? 'bg-white/60' : 'bg-gray-400'
                      )}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        actualTheme === 'dark' ? 'bg-white/60' : 'bg-gray-400'
                      )}
                    />
                  </div>
                  <span className={cn(
                    "text-sm",
                    actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  )}>
                    Thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mb-4 p-4 border rounded-xl max-w-xl mx-auto",
                actualTheme === 'dark'
                  ? "bg-red-900/20 border-red-700"
                  : "bg-red-50 border-red-300"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium mb-1",
                    actualTheme === 'dark' ? 'text-red-300' : 'text-red-700'
                  )}>
                    Error
                  </p>
                  <p className={cn(
                    "text-sm break-words",
                    actualTheme === 'dark' ? 'text-red-200' : 'text-red-600'
                  )}>
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className={cn(
                      "text-sm underline mt-2",
                      actualTheme === 'dark' ? 'text-red-300 hover:text-red-200' : 'text-red-700 hover:text-red-600'
                    )}
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
        
        {/* Input Area - Fixed at Bottom */}
        <div className="flex-shrink-0 border-t border-gray-200/20">
          <ChatInput 
            onSend={handleSendMessage}
            loading={loading}
            conversationId={conversationId}
          />
        </div>
      
      {/* Modals */}
      <ChatModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={setCurrentMode}
        currentMode={currentMode}
      />
      
      <FileManagerModal
        isOpen={showFileManager}
        onClose={() => setShowFileManager(false)}
        conversationId={conversationId}
      />
    </div>
  )
}
