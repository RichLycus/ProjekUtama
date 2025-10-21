import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Loader2, Paperclip, Mic, Image as ImageIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePersonaStore } from '@/store/personaStore'

interface ChatInputProps {
  onSend: (message: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, loading = false, disabled = false, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentPersona } = usePersonaStore()
  
  // Dynamic placeholder based on persona
  // Generate context-aware placeholder from persona's tone and response_style
  const generatePlaceholder = () => {
    if (placeholder) return placeholder
    
    if (currentPersona) {
      const tone = currentPersona.tone?.toLowerCase() || ''
      const style = currentPersona.response_style?.toLowerCase() || ''
      
      // Generate based on personality
      if (tone.includes('casual') || tone.includes('friendly')) {
        return `Hey! What's on your mind?`
      } else if (tone.includes('professional')) {
        return 'How may I assist you today?'
      } else if (style.includes('creative')) {
        return 'Share your ideas with me...'
      } else if (style.includes('technical')) {
        return 'What would you like to know?'
      }
      
      // Default with persona name
      return `Ask ${currentPersona.ai_nickname || currentPersona.ai_name || 'me'} anything...`
    }
    
    return 'What do you want to know?'
  }
  
  const dynamicPlaceholder = generatePlaceholder()
  
  const handleSend = () => {
    if (message.trim() && !loading && !disabled) {
      onSend(message.trim())
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }
  
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }
  
  return (
    <div className="p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Modern Input Container */}
        <div 
          className={cn(
            'relative rounded-3xl transition-all duration-300',
            'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',
            'border-2 transition-colors',
            isFocused 
              ? 'border-primary shadow-lg shadow-primary/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
            'overflow-hidden'
          )}
        >
          <div className="flex items-end gap-2 p-3">
            {/* Left Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 mb-1">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={dynamicPlaceholder}
              disabled={disabled || loading}
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent text-base',
                'text-text dark:text-white',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'py-2 px-2',
                'max-h-[200px] overflow-y-auto'
              )}
              style={{
                minHeight: '40px',
              }}
            />
            
            {/* Right Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 mb-1">
              {/* Voice Input */}
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                title="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || loading || disabled}
                className={cn(
                  'p-2.5 rounded-full transition-all duration-200',
                  'flex items-center justify-center',
                  message.trim() && !loading && !disabled
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Gradient Border Effect on Focus */}
          {isFocused && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-purple-500/20 animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Helper Text */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}
