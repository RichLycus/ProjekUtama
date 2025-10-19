import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import AvatarDisplay from '../components/chat/AvatarDisplay'
import AgentStatusPanel from '../components/chat/AgentStatusPanel'
import { MessageSquare, AlertCircle } from 'lucide-react'

export default function ChatPage() {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    setError 
  } = useChatStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <div className="h-screen flex flex-col bg-background dark:bg-dark-background">
      {/* Header */}
      <div className="glass-strong border-b border-gray-200 dark:border-dark-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text dark:text-white">
              AI Chat
            </h1>
            <p className="text-xs text-text-secondary dark:text-gray-400">
              Powered by Ollama • Lycus Persona
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Avatar & Status */}
        <div className="w-80 border-r border-gray-200 dark:border-dark-border p-4 space-y-4 overflow-y-auto">
          <AvatarDisplay isThinking={loading} />
          <AgentStatusPanel loading={loading} />
        </div>
        
        {/* Center - Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-text dark:text-white mb-2">
                  Mulai Percakapan Baru
                </h2>
                <p className="text-text-secondary dark:text-gray-400 max-w-md mx-auto">
                  Halo! Saya Lycus, asisten AI Anda. Tanyakan apa saja tentang coding, tools, atau hal lainnya.
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                      Error
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">
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