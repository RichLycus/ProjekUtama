import { useState, useEffect } from 'react'
import { X, FileText, Image as ImageIcon, Download, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface FileItem {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  file_size_mb: number
  file_path: string
  uploaded_at: string
  parsed: boolean
}

interface FileManagerModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
}

export default function FileManagerModal({
  isOpen,
  onClose,
  conversationId
}: FileManagerModalProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

  // Fetch files when modal opens or conversation changes
  useEffect(() => {
    if (isOpen && conversationId) {
      fetchFiles()
    }
  }, [isOpen, conversationId])

  const fetchFiles = async () => {
    if (!conversationId) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/conversations/${conversationId}/files`
      )

      if (response.data.success) {
        setFiles(response.data.files || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch files:', err)
      setError(err.response?.data?.detail || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/files/${fileId}/view`,
        { responseType: 'blob' }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download file')
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Yakin ingin menghapus file ini?')) return

    try {
      await axios.delete(`${BACKEND_URL}/api/chat/files/${fileId}`)
      // Refresh file list
      fetchFiles()
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Failed to delete file')
    }
  }

  const getFileIcon = (fileType: string) => {
    const imageTypes = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    if (imageTypes.includes(fileType)) {
      return <ImageIcon className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Slide Panel from Right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-96 z-50',
              'bg-white dark:bg-gray-900',
              'shadow-2xl border-l border-gray-200 dark:border-gray-700',
              'flex flex-col'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  File
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  data-testid="file-manager-close-button"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Belum ada file yang diupload
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  {/* Section: File Terupload */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">
                      File Terupload
                    </h3>

                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.file_id}
                          className={cn(
                            'group p-3 rounded-lg border transition-all cursor-pointer',
                            'bg-white dark:bg-gray-800',
                            'border-gray-200 dark:border-gray-700',
                            'hover:border-primary dark:hover:border-primary',
                            'hover:shadow-md'
                          )}
                          data-testid={`file-item-${file.file_id}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                              {getFileIcon(file.file_type)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.filename}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {file.file_type.toUpperCase().replace('.', '')} • {file.file_size_mb} MB
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {formatDate(file.uploaded_at)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDownload(file.file_id, file.filename)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download"
                                data-testid={`download-file-${file.file_id}`}
                              >
                                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(file.file_id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                                data-testid={`delete-file-${file.file_id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - File Count */}
            {!loading && files.length > 0 && (
              <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {files.length} file{files.length !== 1 ? 's' : ''} terupload
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
