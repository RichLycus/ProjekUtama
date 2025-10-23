import { useState } from 'react'
import { X, FileText, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import FileUploader, { UploadedFile } from './FileUploader'
import ImageUploader, { UploadedImage } from './ImageUploader'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'file' | 'image'
  onUploadComplete?: (files: (UploadedFile | UploadedImage)[]) => void
  conversationId?: string
}

export default function UploadModal({
  isOpen,
  onClose,
  type,
  onUploadComplete,
  conversationId
}: UploadModalProps) {
  const [uploadedItems, setUploadedItems] = useState<(UploadedFile | UploadedImage)[]>([])

  const handleFileUploaded = (file: UploadedFile | UploadedImage) => {
    setUploadedItems(prev => [...prev, file])
  }

  const handleDone = () => {
    if (uploadedItems.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedItems)
    }
    setUploadedItems([])
    onClose()
  }

  const handleClose = () => {
    setUploadedItems([])
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={cn(
                'relative w-full max-w-2xl max-h-[80vh] overflow-y-auto',
                'bg-white dark:bg-gray-900',
                'rounded-2xl shadow-2xl',
                'border border-gray-200 dark:border-gray-700'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {type === 'file' ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {type === 'file' ? 'Upload Documents' : 'Upload Images'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {type === 'file'
                          ? 'PDF, DOCX, TXT, CSV files'
                          : 'PNG, JPG, WEBP, GIF images'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {type === 'file' ? (
                  <FileUploader
                    onFileUploaded={handleFileUploaded}
                    multiple={true}
                    conversationId={conversationId}
                  />
                ) : (
                  <ImageUploader
                    onImageUploaded={handleFileUploaded}
                    multiple={true}
                    conversationId={conversationId}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadedItems.length} item{uploadedItems.length !== 1 ? 's' : ''} uploaded
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDone}
                      disabled={uploadedItems.length === 0}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        uploadedItems.length > 0
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      )}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
