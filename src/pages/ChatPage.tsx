import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { usePersonaStore } from '../store/personaStore'
import { useBackgroundStore } from '../store/backgroundStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import BackgroundSettingsModal from '../components/chat/BackgroundSettingsModal'
import { MessageSquare, AlertCircle, Settings, Sparkles } from 'lucide-react'

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
      className="h-full flex flex-col relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Background Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Settings Button - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBackgroundSettings(true)}
            className="p-3 rounded-full glass-strong border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transition-all group"
            title="Background Settings"
          >
            <Settings className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Empty State - Centered Welcome */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4"
            >
              {/* Logo/Avatar - Large & Centered */}
              <div className="mb-8">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-2xl">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                  {/* Animated rings */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-primary/30 animate-ping" />
                  <div className="absolute inset-0 rounded-3xl border-4 border-secondary/20 animate-pulse" />
                </div>
              </div>

              {/* Welcome Text */}
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 text-center">
                {currentPersona?.ai_name || 'ChimeraAI'}
              </h1>
              <p className="text-lg sm:text-xl text-white/80 text-center mb-8 max-w-lg">
                {currentPersona?.sample_greeting || 'How can I help you today?'}
              </p>

              {/* Quick Actions / Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
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
                    className="glass-strong rounded-2xl p-4 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{action.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1 group-hover:text-primary transition-colors">
                          {action.text}
                        </h3>
                        <p className="text-white/60 text-sm">{action.subtext}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Feature Badge */}
              <div className="mt-8 flex items-center gap-2 glass-strong rounded-full px-4 py-2 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-white/80 text-sm">
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
              className="mb-4 p-4 glass-strong border border-red-400/50 rounded-xl max-w-xl mx-auto"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-300 mb-1">
                    Error
                  </p>
                  <p className="text-sm text-red-200 break-words">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-300 hover:text-red-200 underline mt-2"
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
        <div className="flex-shrink-0">
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
