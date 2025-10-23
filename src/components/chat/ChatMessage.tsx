import { motion } from 'framer-motion'
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import TypewriterText from '@/components/TypewriterText'
import MarkdownRenderer from './MarkdownRenderer'
import { usePersonaStore } from '@/store/personaStore'

interface ExecutionLog {
  router?: string | object
  rag?: string | object
  execution?: string | object
  reasoning?: string | object
  persona?: string | object
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  agent_tag?: string
  execution_log?: ExecutionLog
}

export default function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  agent_tag,
  execution_log 
}: ChatMessageProps) {
  const [showLog, setShowLog] = useState(false)
  const [typingComplete, setTypingComplete] = useState(false)
  const isUser = role === 'user'
  
  // Get current persona for custom names
  const { currentPersona } = usePersonaStore()
  
  // Get display names
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
  const userDisplayName = currentPersona?.user_display_name || 'You'
  const aiDisplayName = agent_tag || currentPersona?.ai_name || 'Assistant'
  const userAvatarUrl = currentPersona?.avatar_url 
    ? `${BACKEND_URL}${currentPersona.avatar_url}` 
    : null
  
  // Helper to safely render log values
  const renderLogValue = (value: string | object | undefined) => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      // Handle objects by displaying key-value pairs in a readable format
      try {
        const entries = Object.entries(value)
        if (entries.length === 0) return 'Empty object'
        
        // If object has only 1 key, show its value
        if (entries.length === 1) {
          return String(entries[0][1])
        }
        
        // For multiple keys, show as key: value pairs
        return entries.map(([key, val]) => {
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1)
          return `${displayKey}: ${val}`
        }).join(' | ')
      } catch (error) {
        // Fallback to JSON stringify if parsing fails
        return JSON.stringify(value, null, 2)
      }
    }
    return String(value)
  }
  
  // Format timestamp
  const formatTime = (time?: string) => {
    if (!time) return 'Just now'
    const date = new Date(time)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }
  
  const hasExecutionLog = execution_log && Object.keys(execution_log).length > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'mb-4 flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
          : 'bg-gradient-to-r from-purple-500 to-purple-600'
      )}>
        {isUser && userAvatarUrl ? (
          <img 
            src={userAvatarUrl} 
            alt="User avatar" 
            className="w-full h-full object-cover"
          />
        ) : isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        ) : (
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        )}
      </div>
      
      {/* Message content */}
      <div className={cn(
        'flex-1 min-w-0 max-w-full sm:max-w-3xl',
        isUser && 'flex flex-col items-end'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center gap-2 mb-1',
          isUser && 'flex-row-reverse'
        )}>
          <span className="text-sm font-semibold text-text dark:text-white">
            {isUser ? userDisplayName : aiDisplayName}
          </span>
          <span className="text-xs text-text-muted dark:text-gray-500">
            {formatTime(timestamp)}
          </span>
        </div>
        
        {/* Content bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-3 break-words',
          isUser
            ? 'bg-primary/10 dark:bg-primary/20 text-text dark:text-white'
            : 'glass-strong text-text dark:text-white'
        )}>
          {isUser ? (
            <div className="text-sm sm:text-base whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="text-sm sm:text-base prose prose-sm dark:prose-invert max-w-none">
              {typingComplete ? (
                <MarkdownRenderer content={content} />
              ) : (
                <TypewriterText 
                  text={content} 
                  speed={50}
                  onComplete={() => setTypingComplete(true)}
                />
              )}
            </div>
          )}
          
          {/* Execution Log */}
          {!isUser && hasExecutionLog && typingComplete && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => setShowLog(!showLog)}
                className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {showLog ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span>⚡ Execution Log</span>
              </button>
              
              {showLog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1 text-xs"
                >
                  {execution_log.router && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 flex-shrink-0">• Router:</span>
                      <span className="text-text-secondary dark:text-gray-400 whitespace-pre-wrap break-words flex-1">{renderLogValue(execution_log.router)}</span>
                    </div>
                  )}
                  {execution_log.rag && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 flex-shrink-0">• RAG:</span>
                      <span className="text-text-secondary dark:text-gray-400 whitespace-pre-wrap break-words flex-1">{renderLogValue(execution_log.rag)}</span>
                    </div>
                  )}
                  {execution_log.execution && (
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500 flex-shrink-0">• Execution:</span>
                      <span className="text-text-secondary dark:text-gray-400 whitespace-pre-wrap break-words flex-1">{renderLogValue(execution_log.execution)}</span>
                    </div>
                  )}
                  {execution_log.reasoning && (
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 flex-shrink-0">• Reasoning:</span>
                      <span className="text-text-secondary dark:text-gray-400 whitespace-pre-wrap break-words flex-1">{renderLogValue(execution_log.reasoning)}</span>
                    </div>
                  )}
                  {execution_log.persona && (
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500 flex-shrink-0">• Persona:</span>
                      <span className="text-text-secondary dark:text-gray-400 whitespace-pre-wrap break-words flex-1">{renderLogValue(execution_log.persona)}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
