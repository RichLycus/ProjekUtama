import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface FileUploaderProps {
  onFileUploaded?: (file: UploadedFile) => void
  accept?: string // Dibiarkan di interface kalau mau dipakai nanti
  maxSize?: number
  multiple?: boolean
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
  multiple = false
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

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.file_id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {file.file_size_mb}MB • {file.file_type}
                </p>
              </div>
              <Check className="w-5 h-5 text-green-500" />
              <button
                onClick={() => removeFile(file.file_id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}