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
  conversationId?: string
}

export interface UploadedImage {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  file_size_mb: number
  image_url: string
  preview_url?: string  // Local blob URL for preview
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
  multiple = false,
  conversationId
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({})

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

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
        if (conversationId) {
          formData.append('conversation_id', conversationId)
        }

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
          const uploadedImage = {
            ...response.data,
            preview_url: previewUrl  // Include blob URL for preview
          }
          setUploadedImages(prev => [...prev, uploadedImage])
          
          // Move preview URL to actual file_id
          setPreviewUrls(prev => {
            const newPreviews = { ...prev }
            newPreviews[uploadedImage.file_id] = previewUrl
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

      {/* Uploaded Images Grid - Enhanced Preview dengan Bingkai Khusus */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AnimatePresence>
            {uploadedImages.map((image) => (
              <motion.div
                key={image.file_id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: 'spring', damping: 20 }}
                className="group relative"
              >
                {/* Bingkai Khusus dengan Shadow dan Border */}
                <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-white dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  {/* Success Indicator Badge */}
                  <div className="absolute top-2 right-2 z-10 bg-green-500 rounded-full p-1.5 shadow-lg">
                    <Check className="w-3 h-3 text-white" />
                  </div>

                  {/* Image Preview dengan Inner Border */}
                  <div className="absolute inset-2 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img
                      src={previewUrls[image.file_id]}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-4 gap-2">
                    {/* File Info */}
                    <div className="w-full space-y-1 mb-2">
                      <p className="text-white text-xs font-semibold text-center truncate px-2">
                        {image.filename}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-white/90 text-[10px]">
                        <span>{image.metadata?.width} × {image.metadata?.height}</span>
                        <span>•</span>
                        <span>{image.file_size_mb.toFixed(2)}MB</span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(image.file_id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-lg flex items-center gap-2"
                    >
                      <X className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-medium">Remove</span>
                    </button>
                  </div>

                  {/* Decorative Corner Accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br-lg" />
                </div>

                {/* File Type Badge di Bawah Bingkai */}
                <div className="mt-2 flex items-center justify-center">
                  <div className="px-3 py-1 bg-gradient-to-r from-primary to-secondary rounded-full shadow-md">
                    <span className="text-white text-[10px] font-bold uppercase">
                      {image.file_type.split('/').pop()}
                    </span>
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
