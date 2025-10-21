import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ImageIcon, X, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageUploaderProps {
  onImageUploaded?: (image: UploadedImage) => void
  maxSize?: number
  multiple?: boolean
}

export interface UploadedImage {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  file_size_mb: number
  image_url: string
  metadata?: {
    width: number
    height: number
    format: string
  }
  uploaded_at: string
}

export default function ImageUploader({
  onImageUploaded,
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({})

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    
    for (const file of acceptedFiles) {
      // Validate file size
      if (file.size > maxSize) {
        setError(`Image "${file.name}" is too large. Max size: ${maxSize / (1024*1024)}MB`)
        continue
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      const tempId = `temp-${Date.now()}`
      setPreviewUrls(prev => ({ ...prev, [tempId]: previewUrl }))

      setUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post<{ success: boolean } & UploadedImage>(
          `${BACKEND_URL}/api/chat/upload-image`,
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
          const uploadedImage = response.data
          setUploadedImages(prev => [...prev, uploadedImage])
          
          // Move preview URL to actual file_id
          setPreviewUrls(prev => {
            const newPreviews = { ...prev }
            newPreviews[uploadedImage.file_id] = newPreviews[tempId]
            delete newPreviews[tempId]
            return newPreviews
          })
          
          onImageUploaded?.(uploadedImage)
        }
      } catch (err: any) {
        console.error('Image upload error:', err)
        setError(err.response?.data?.detail || 'Failed to upload image')
        // Clean up preview URL on error
        URL.revokeObjectURL(previewUrl)
        setPreviewUrls(prev => {
          const newPreviews = { ...prev }
          delete newPreviews[tempId]
          return newPreviews
        })
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
  }, [maxSize, onImageUploaded, BACKEND_URL])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxSize,
    multiple,
  })

  const removeImage = (fileId: string) => {
    // Revoke preview URL
    if (previewUrls[fileId]) {
      URL.revokeObjectURL(previewUrls[fileId])
    }
    setUploadedImages(prev => prev.filter(img => img.file_id !== fileId))
    setPreviewUrls(prev => {
      const newPreviews = { ...prev }
      delete newPreviews[fileId]
      return newPreviews
    })
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
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive ? (
                    'Drop images here'
                  ) : (
                    <>
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, WEBP, GIF (max {maxSize / (1024*1024)}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {uploadedImages.map((image) => (
              <motion.div
                key={image.file_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
              >
                {/* Image Preview */}
                <img
                  src={previewUrls[image.file_id]}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                  <p className="text-white text-xs font-medium text-center truncate w-full px-2">
                    {image.filename}
                  </p>
                  <p className="text-white/80 text-xs">
                    {image.metadata?.width} × {image.metadata?.height}
                  </p>
                  <p className="text-white/80 text-xs">
                    {image.file_size_mb}MB
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <button
                      onClick={() => removeImage(image.file_id)}
                      className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
