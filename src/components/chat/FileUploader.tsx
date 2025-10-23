import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { motion } from 'framer-motion'

interface FileUploaderProps {
  onFileUploaded?: (file: UploadedFile) => void
  accept?: string // Dibiarkan di interface kalau mau dipakai nanti
  maxSize?: number
  multiple?: boolean
  conversationId?: string
}

export interface UploadedFile {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  file_size_mb: number
  parsed_content?: string
  metadata?: any
  uploaded_at: string
}

export default function FileUploader({
  onFileUploaded,
  // accept = '.pdf,.docx,.doc,.txt,.md,.csv', // <--- Dihapus untuk menghilangkan error TS6133
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  conversationId
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    
    for (const file of acceptedFiles) {
      // Validate file size
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Max size: ${maxSize / (1024*1024)}MB`)
        continue
      }

      setUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (conversationId) {
          formData.append('conversation_id', conversationId)
        }

        const response = await axios.post<{ success: boolean } & UploadedFile>(
          `${BACKEND_URL}/api/chat/upload-file`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0
              setUploadProgress(progress)
            },
          }
        )

        if (response.data.success) {
          const uploadedFile = response.data
          setUploadedFiles(prev => [...prev, uploadedFile])
          onFileUploaded?.(uploadedFile)
        }
      } catch (err: any) {
        console.error('File upload error:', err)
        setError(err.response?.data?.detail || 'Failed to upload file')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
  }, [maxSize, onFileUploaded, BACKEND_URL])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv']
    },
    maxSize,
    multiple,
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file_id !== fileId))
  }

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive ? (
                    'Drop files here'
                  ) : (
                    <>
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PDF, DOCX, TXT, CSV (max {maxSize / (1024*1024)}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Uploaded Files List - Enhanced Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((file) => (
            <motion.div
              key={file.file_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              {/* Gradient Background Accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-purple-500/5" />
              
              <div className="relative flex items-start gap-4 p-4">
                {/* Large Colorful Icon */}
                <div className="flex-shrink-0">
                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                    {/* File type badge */}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {file.file_type.split('/').pop()?.slice(0, 3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {file.filename}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Check className="w-5 h-5 text-green-500" />
                      <button
                        onClick={() => removeFile(file.file_id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                      >
                        <X className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                  
                  {/* File Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {file.file_size_mb.toFixed(2)}MB
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {file.file_type}
                    </span>
                  </div>

                  {/* Content Preview */}
                  {file.parsed_content && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        {file.parsed_content.slice(0, 200)}
                        {file.parsed_content.length > 200 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Indicator Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}