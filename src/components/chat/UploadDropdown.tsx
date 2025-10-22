import { useState, useRef, useEffect } from 'react'
import { FileText, Image as ImageIcon, Video, Music, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import UploadModal from './UploadModal'
import { UploadedFile } from './FileUploader'
import { UploadedImage } from './ImageUploader'

interface UploadDropdownProps {
  onUploadComplete?: (files: (UploadedFile | UploadedImage)[]) => void
}

const uploadOptions = [
  {
    id: 'document',
    label: 'Upload document',
    icon: FileText,
    type: 'file' as const,
    description: 'PDF, DOCX, TXT, CSV'
  },
  {
    id: 'image',
    label: 'Upload Image',
    icon: ImageIcon,
    type: 'image' as const,
    description: 'PNG, JPG, WEBP, GIF'
  },
  {
    id: 'video',
    label: 'Upload Video',
    icon: Video,
    type: 'file' as const,
    description: 'Coming soon'
  },
  {
    id: 'audio',
    label: 'Upload Audio',
    icon: Music,
    type: 'file' as const,
    description: 'Coming soon'
  }
]

export default function UploadDropdown({ onUploadComplete }: UploadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'file' | 'image'>('file')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOptionClick = (option: typeof uploadOptions[0]) => {
    if (option.id === 'video' || option.id === 'audio') {
      // Coming soon functionality
      return
    }

    setUploadType(option.type)
    setShowUploadModal(true)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
            'bg-white dark:bg-gray-800 border-2',
            isOpen 
              ? 'border-primary text-primary shadow-lg shadow-primary/20' 
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
            'hover:shadow-md'
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Upload</span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} 
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute bottom-full left-0 mb-2 w-72',
                'bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
                'border border-gray-200 dark:border-gray-700',
                'overflow-hidden z-50'
              )}
            >
              <div className="p-2 space-y-1">
                {uploadOptions.map((option) => {
                  const Icon = option.icon
                  const isDisabled = option.id === 'video' || option.id === 'audio'

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                        'text-left',
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        option.id === 'document' && 'bg-blue-100 dark:bg-blue-900/30',
                        option.id === 'image' && 'bg-green-100 dark:bg-green-900/30',
                        option.id === 'video' && 'bg-purple-100 dark:bg-purple-900/30',
                        option.id === 'audio' && 'bg-orange-100 dark:bg-orange-900/30'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          option.id === 'document' && 'text-blue-600 dark:text-blue-400',
                          option.id === 'image' && 'text-green-600 dark:text-green-400',
                          option.id === 'video' && 'text-purple-600 dark:text-purple-400',
                          option.id === 'audio' && 'text-orange-600 dark:text-orange-400'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type={uploadType}
        onUploadComplete={onUploadComplete}
      />
    </>
  )
}
