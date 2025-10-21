import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { useThemeStore } from '../store/themeStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import BackgroundSettingsModal from '../components/chat/BackgroundSettingsModal'
import AgentInfoBadge from '../components/chat/AgentInfoBadge'
import { MessageSquare, AlertCircle, Settings, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

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
  const { backgroundType, backgroundValue } = useBackgroundStore()
  const { actualTheme } = useThemeStore()
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)
  
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
  
  // Get background style
  const getBackgroundStyle = () => {
    if (backgroundType === 'image') {
      return {
        backgroundImage: `url(${backgroundValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    } else if (backgroundType === 'gradient') {
      return { background: backgroundValue }
    } else if (backgroundType === 'color') {
      return { backgroundColor: backgroundValue }
    } else {
      return { background: backgroundValue }
    }
  }
  
  return (
    <div 
      className="h-[calc(100vh-2rem)] flex flex-col relative"
      style={getBackgroundStyle()}
    >
      {/* Background Overlay for better readability */}
      <div className={cn(
        "absolute inset-0 backdrop-blur-[2px]",
        actualTheme === 'dark' 
          ? "bg-black/40" 
          : "bg-white/30"
      )} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Bar - Fixed */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
          {/* Agent Info Badge - Top Left */}
          <div>
            <AgentInfoBadge />
          </div>

          {/* Settings Button - Top Right */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBackgroundSettings(true)}
            className={cn(
              "p-3 rounded-full border shadow-lg hover:shadow-xl transition-all group",
              actualTheme === 'dark'
                ? "glass-strong border-white/20 hover:border-white/40"
                : "bg-white/90 border-gray-200 hover:border-gray-300"
            )}
            title="Background Settings"
          >
            <Settings className={cn(
              "w-5 h-5 group-hover:rotate-90 transition-transform duration-300",
              actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
            )} />
          </motion.button>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {/* Empty State - Centered Welcome */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8"
            >
              {/* Logo/Avatar - Large & Centered */}
              <div className="mb-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-2xl">
                    <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
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

              {/* Quick Actions / Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-6">
                {[
                  { icon: '🔍', text: 'Search information', subtext: 'Find answers quickly' },
                  { icon: '💡', text: 'Get ideas', subtext: 'Creative solutions' },
                  { icon: '📝', text: 'Write content', subtext: 'Articles, emails, more' },
                  { icon: '🎨', text: 'Create projects', subtext: 'Design and build' },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "rounded-2xl p-4 border transition-all text-left group",
                      actualTheme === 'dark'
                        ? "glass-strong border-white/20 hover:border-white/40 hover:bg-white/10"
                        : "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white/95"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{action.icon}</span>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold mb-1 group-hover:text-primary transition-colors",
                          actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {action.text}
                        </h3>
                        <p className={cn(
                          "text-sm",
                          actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
                        )}>
                          {action.subtext}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Feature Badge */}
              <div className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 border",
                actualTheme === 'dark'
                  ? "glass-strong border-white/20"
                  : "bg-white/80 border-gray-200"
              )}>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className={cn(
                  "text-sm",
                  actualTheme === 'dark' ? 'text-white/80' : 'text-gray-700'
                )}>
                  Powered by Advanced AI
                </span>
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
              className={cn(
                "mb-4 p-4 border rounded-xl max-w-xl mx-auto",
                actualTheme === 'dark'
                  ? "glass-strong border-red-400/50"
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
            onSend={sendMessage}
            loading={loading}
          />
        </div>
      </div>

      {/* Background Settings Modal */}
      <BackgroundSettingsModal
        isOpen={showBackgroundSettings}
        onClose={() => setShowBackgroundSettings(false)}
      />
    </div>
  )
}
