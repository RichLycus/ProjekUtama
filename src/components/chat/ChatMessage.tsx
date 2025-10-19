import { motion } from 'framer-motion'
import { User, Bot, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ExecutionLog {
  router?: string
  rag?: string
  execution?: string
  reasoning?: string
  persona?: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
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
  const isUser = role === 'user'
  const isSystem = role === 'system'
  
  // Format timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      {/* Avatar (for assistant) */}
      {!isUser && !isSystem && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3',
          isUser && 'bg-gradient-to-r from-primary to-secondary text-white',
          !isUser && !isSystem && 'glass-strong dark:bg-dark-surface',
          isSystem && 'bg-gray-100 dark:bg-dark-surface/50 text-center max-w-md'
        )}
      >
        {/* Agent tag (for assistant) */}
        {agent_tag && !isUser && (
          <div className="text-xs font-medium text-primary dark:text-accent mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-accent animate-pulse" />
            {agent_tag}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser ? 'text-white' : 'text-text dark:text-white',
          isSystem && 'text-text-secondary dark:text-gray-400 text-xs'
        )}>
          {content}
        </div>
        
        {/* Execution log (for assistant) */}
        {execution_log && !isUser && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
            <div className="text-xs text-text-muted dark:text-gray-500 space-y-1">
              <div className="font-semibold mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Execution Log:
              </div>
              {execution_log.router && (
                <div>• Router: {execution_log.router}</div>
              )}
              {execution_log.rag && (
                <div>• RAG: {execution_log.rag}</div>
              )}
              {execution_log.execution && (
                <div>• Execution: {execution_log.execution}</div>
              )}
              {execution_log.reasoning && (
                <div>• Reasoning: {execution_log.reasoning}</div>
              )}
              {execution_log.persona && (
                <div>• Persona: {execution_log.persona}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Timestamp */}
        <div className={cn(
          'text-xs mt-2',
          isUser ? 'text-white/70' : 'text-text-muted dark:text-gray-500'
        )}>
          {formatTime(timestamp)}
        </div>
      </div>
      
      {/* Avatar (for user) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
      )}
    </motion.div>
  )
}
