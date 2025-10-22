import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Loader2, Mic, X, Lightbulb, Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePersonaStore } from '@/store/personaStore'
import UploadDropdown from './UploadDropdown'
import { UploadedFile } from './FileUploader'
import { UploadedImage } from './ImageUploader'

interface ChatInputProps {
  onSend: (message: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, loading = false, disabled = false, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<(UploadedFile | UploadedImage)[]>([])
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
      // Send message with attached files info if any
      let messageToSend = message.trim()
      
      if (attachedFiles.length > 0) {
        const fileInfo = attachedFiles.map(f => `[File: ${f.filename}]`).join(' ')
        messageToSend = `${fileInfo}\n\n${messageToSend}`
      }
      
      onSend(messageToSend)
      setMessage('')
      setAttachedFiles([])
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }
  
  const handleUploadComplete = (files: (UploadedFile | UploadedImage)[]) => {
    setAttachedFiles(prev => [...prev, ...files])
  }
  
  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
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
    <>
      <div className="p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.filename}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* New Layout - Input Container */}
          <div 
            className={cn(
              'relative rounded-2xl transition-all duration-300',
              'bg-white dark:bg-gray-800 border-2 transition-colors',
              isFocused 
                ? 'border-primary shadow-lg shadow-primary/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            {/* Text Input Area (Top) */}
            <div className="p-4 pb-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={dynamicPlaceholder}
                disabled={disabled || loading}
                rows={3}
                className={cn(
                  'w-full resize-none bg-transparent text-base',
                  'text-gray-900 dark:text-white',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:outline-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'max-h-[200px] overflow-y-auto'
                )}
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              {/* Left Actions: Upload, Think, Search */}
              <div className="flex items-center gap-2">
                {/* Upload Dropdown */}
                <UploadDropdown onUploadComplete={handleUploadComplete} />
                
                {/* Think Button */}
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                    'bg-white dark:bg-gray-800 border-2',
                    'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                  )}
                  title="Think"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-medium">Think</span>
                </button>

                {/* Search Button */}
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                    'bg-white dark:bg-gray-800 border-2',
                    'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                  )}
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                  <span className="text-sm font-medium">Search</span>
                </button>
              </div>

              {/* Right Action: Mic or Send Button */}
              <div className="flex items-center">
                {!message.trim() ? (
                  /* Mic Button - shown when no text */
                  <button
                    type="button"
                    className={cn(
                      'p-3 rounded-xl transition-all duration-200',
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                      'hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                    title="Voice input"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                ) : (
                  /* Send Button - shown when text exists */
                  <button
                    onClick={handleSend}
                    disabled={loading || disabled}
                    className={cn(
                      'p-3 rounded-xl transition-all duration-200',
                      'flex items-center justify-center',
                      !loading && !disabled
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:scale-105'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Gradient Border Effect on Focus */}
            {isFocused && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-purple-500/10" />
              </div>
            )}
          </div>
          
          {/* Helper Text */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}
