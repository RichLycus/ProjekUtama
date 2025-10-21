import { useState } from 'react'
import { X, Upload, Image, Folder, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '@/lib/backend'

interface UploadGameModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function UploadGameModal({ isOpen, onClose, onSuccess }: UploadGameModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [gameZip, setGameZip] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileTree, setFileTree] = useState<any>(null)

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP file')
      return
    }

    setGameZip(file)
    toast.success(`Selected: ${file.name}`)

    // Preview ZIP contents (basic - just show it's loaded)
    const fileSize = (file.size / (1024 * 1024)).toFixed(2)
    setFileTree({
      name: file.name,
      size: `${fileSize} MB`,
      type: 'ZIP Archive'
    })
  }

  const handleUpload = async () => {
    if (!name || !description || !gameZip) {
      toast.error('Please fill in all required fields')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading and extracting game...')

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('cover_image_url', coverImageUrl)
      formData.append('game_zip', gameZip)

      const response = await fetch(`${API_ENDPOINTS.BACKEND_URL}/api/games/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('🎮 Game uploaded successfully!', { id: toastId })
        onSuccess()
        handleClose()
      } else {
        toast.error(data.message || 'Upload failed', { id: toastId })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload game', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setCoverImageUrl('')
    setGameZip(null)
    setFileTree(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upload WebGL Game</h2>
              <p className="text-sm text-secondary">Upload your game as a ZIP file</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Game Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Game Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Flappy Bird Clone"
              className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your game..."
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cover Image URL (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <p className="text-xs text-secondary mt-1">
              Leave empty for auto-generated placeholder
            </p>
          </div>

          {/* ZIP File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Game ZIP File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                id="game-zip-upload"
              />
              <label
                htmlFor="game-zip-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Folder className="w-8 h-8 text-primary" />
                </div>
                {gameZip ? (
                  <>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      {gameZip.name}
                    </p>
                    <p className="text-xs text-secondary">
                      {fileTree?.size} • Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">
                      Click to select ZIP file
                    </p>
                    <p className="text-xs text-secondary">
                      ZIP file must contain index.html
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium">Important Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>ZIP must contain <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">index.html</code> file</li>
                  <li>Game should be WebGL/HTML5 compatible</li>
                  <li>All assets (images, audio, scripts) must be in ZIP</li>
                  <li>Relative paths only (no absolute URLs to local files)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-6 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!name || !description || !gameZip || uploading}
            className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Game
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
