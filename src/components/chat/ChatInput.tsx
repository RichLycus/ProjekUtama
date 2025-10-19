import { useState, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  loading?: boolean
  disabled?: boolean
}

export default function ChatInput({ onSend, loading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')
  
  const handleSend = () => {
    if (message.trim() && !loading && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }
  
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <div className="glass-strong border-t border-gray-200 dark:border-dark-border p-3 sm:p-4">
      <div className="flex items-end gap-2 sm:gap-3">
        {/* Text input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan Anda..."
          disabled={disabled || loading}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base',
            'bg-white dark:bg-dark-background',
            'border border-gray-200 dark:border-dark-border',
            'text-text dark:text-white',
            'placeholder:text-text-muted dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            height: 'auto'
          }}
        />
        
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || loading || disabled}
          className={cn(
            'flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl',
            'bg-gradient-to-r from-primary to-secondary',
            'text-white',
            'flex items-center justify-center',
            'hover:shadow-lg hover:scale-105',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'transition-all duration-200'
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
