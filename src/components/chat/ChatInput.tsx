import { useState, KeyboardEvent, useRef, DragEvent, ClipboardEvent } from 'react'
import { Send, Loader2, Mic, X, Lightbulb, Search, FileText, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePersonaStore } from '@/store/personaStore'
import UploadDropdown from './UploadDropdown'
import { UploadedFile } from './FileUploader'
import { UploadedImage } from './ImageUploader'
import axios from 'axios'
import { motion } from 'framer-motion'

interface ChatInputProps {
  onSend: (message: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  conversationId?: string
}

export default function ChatInput({ onSend, loading = false, disabled = false, placeholder, conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<(UploadedFile | UploadedImage)[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentPersona } = usePersonaStore()
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
  
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
  
  // Handle file upload
  const uploadFile = async (file: File, isImage: boolean = false) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (conversationId) {
        formData.append('conversation_id', conversationId)
      }
      
      const endpoint = isImage ? '/api/chat/upload-image' : '/api/chat/upload-file'
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        setAttachedFiles(prev => [...prev, response.data])
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      alert(err.response?.data?.detail || 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }
  
  // Drag & Drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      await uploadFile(file, isImage)
    }
  }
  
  // Paste handler for images
  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await uploadFile(file, true)
        }
      }
    }
  }
  
  return (
    <>
      <div className="p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Attached Files Preview - Compact Horizontal Style */}
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-purple-500/5 rounded-xl p-3 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
                  </span>
                </div>
                <button
                  onClick={() => setAttachedFiles([])}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => {
                  const isImage = 'image_url' in file
                  const previewUrl = isImage && 'preview_url' in file ? file.preview_url : null
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      {/* Compact Card - 80x80 */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-white dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-all hover:scale-105">
                        
                        {isImage && previewUrl ? (
                          // Image Preview dengan Blob URL
                          <div className="absolute inset-1 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img
                              src={previewUrl}
                              alt={file.filename}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : !isImage ? (
                          // Document Preview
                          <div className="absolute inset-1 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center">
                            <FileText className="w-7 h-7 text-white mb-1" />
                            {/* File Extension Badge */}
                            <div className="bg-white/90 dark:bg-gray-900/90 rounded px-1.5 py-0.5">
                              <span className="text-[8px] font-bold text-blue-600 uppercase">
                                {file.filename.split('.').pop()?.slice(0, 3)}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-1.5">
                          <p className="text-white text-[9px] font-medium text-center truncate w-full">
                            {file.filename.length > 12 ? file.filename.slice(0, 12) + '...' : file.filename}
                          </p>
                          <p className="text-white/80 text-[8px]">
                            {file.file_size_mb.toFixed(1)}MB
                          </p>
                        </div>

                        {/* Remove Button - Compact */}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>

                        {/* Success Badge - Compact */}
                        <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5 shadow-md">
                          <Check className="w-2 h-2 text-white" />
                        </div>

                        {/* Decorative Corners - Smaller */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary rounded-tl" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary rounded-br" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
          
          {/* New Layout - Input Container */}
          <div 
            className={cn(
              'relative rounded-2xl transition-all duration-300',
              'bg-white dark:bg-gray-800 border-2 transition-colors',
              isFocused 
                ? 'border-primary shadow-lg shadow-primary/20' 
                : isDragging
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Text Input Area (Top) */}
            <div className="p-4 pb-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyPress}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={dynamicPlaceholder}
                disabled={disabled || loading || uploading}
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
                <UploadDropdown 
                  onUploadComplete={handleUploadComplete}
                  conversationId={conversationId}
                />
                
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
            
            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center bg-primary/10">
                <div className="text-center">
                  <p className="text-primary font-semibold text-lg">Drop file di sini</p>
                  <p className="text-primary/70 text-sm mt-1">Gambar atau dokumen</p>
                </div>
              </div>
            )}
            
            {/* Upload Progress Overlay */}
            {uploading && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center bg-white/80 dark:bg-gray-800/80">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Uploading...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Helper Text */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
            Press Enter to send, Shift + Enter for new line • Drag & drop atau Ctrl+V untuk upload
          </p>
        </div>
      </div>
    </>
  )
}
