import { useState } from 'react'
import { X, Upload, Image, Folder, AlertCircle, CheckCircle, HelpCircle, ExternalLink, FileWarning, Info } from 'lucide-react'
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
  const [showHelp, setShowHelp] = useState(false)

  // File size limit: 500MB
  const MAX_FILE_SIZE = 500 * 1024 * 1024

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      toast.error('❌ Please select a ZIP file')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`❌ File too large! Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }

    // Validate file name (no special characters that might cause issues)
    const invalidChars = /[<>:"|?*]/
    if (invalidChars.test(file.name)) {
      toast.error('❌ File name contains invalid characters')
      return
    }

    setGameZip(file)
    toast.success(`✅ Selected: ${file.name}`)

    // Preview ZIP contents
    const fileSize = (file.size / (1024 * 1024)).toFixed(2)
    setFileTree({
      name: file.name,
      size: `${fileSize} MB`,
      type: 'ZIP Archive',
      valid: file.size <= MAX_FILE_SIZE
    })
  }

  const handleUpload = async () => {
    if (!name || !description || !gameZip) {
      toast.error('⚠️ Please fill in all required fields')
      return
    }

    // Additional validation
    if (name.length < 3) {
      toast.error('⚠️ Game name must be at least 3 characters')
      return
    }

    if (description.length < 10) {
      toast.error('⚠️ Description must be at least 10 characters')
      return
    }

    setUploading(true)
    const toastId = toast.loading('📦 Uploading and extracting game...')

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
      toast.error('❌ Failed to upload game', { id: toastId })
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
    setShowHelp(false)
    onClose()
  }

  const openWebGLHelp = () => {
    window.open('https://unity.com/download', '_blank')
    toast.success('🔗 Opening Unity WebGL download page...')
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
              className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              data-testid="game-name-input"
              maxLength={100}
            />
            <p className="text-xs text-secondary mt-1 flex items-center justify-between">
              <span>Minimum 3 characters</span>
              <span className={name.length >= 3 ? 'text-green-600 dark:text-green-400' : ''}>
                {name.length}/100
              </span>
            </p>
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
              className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              data-testid="game-description-input"
              maxLength={500}
            />
            <p className="text-xs text-secondary mt-1 flex items-center justify-between">
              <span>Minimum 10 characters</span>
              <span className={description.length >= 10 ? 'text-green-600 dark:text-green-400' : ''}>
                {description.length}/500
              </span>
            </p>
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
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  data-testid="cover-image-input"
                />
              </div>
            </div>
            <p className="text-xs text-secondary mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Leave empty for auto-generated placeholder
            </p>
          </div>

          {/* ZIP File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Game ZIP File <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              gameZip 
                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10' 
                : 'border-gray-300 dark:border-dark-border hover:border-primary'
            }`}>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                id="game-zip-upload"
                data-testid="zip-file-input"
              />
              <label
                htmlFor="game-zip-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${
                  gameZip 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {gameZip ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <Folder className="w-8 h-8" />
                  )}
                </div>
                {gameZip ? (
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {gameZip.name}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-secondary">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {fileTree?.size}
                      </span>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Valid ZIP
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-2">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">
                      Click to select ZIP file
                    </p>
                    <p className="text-xs text-secondary">
                      Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB • Must contain index.html
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
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Important Requirements:</p>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                    data-testid="toggle-help-button"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {showHelp ? 'Hide Tips' : 'Show Tips'}
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>ZIP must contain <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">index.html</code> file</li>
                  <li>Game should be WebGL/HTML5 compatible</li>
                  <li>All assets (images, audio, scripts) must be in ZIP</li>
                  <li>Relative paths only (no absolute URLs to local files)</li>
                  <li>Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* WebGL Help Section */}
          {showHelp && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-300">
              {/* Download WebGL */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300">Need Unity WebGL?</h3>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 mb-3">
                  Download Unity to build and export WebGL games:
                </p>
                <button
                  onClick={openWebGLHelp}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  data-testid="webgl-help-button"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download Unity WebGL
                </button>
              </div>

              {/* Troubleshooting Tips */}
              <div className="border-t border-purple-200 dark:border-purple-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300">WebGL Troubleshooting Tips</h3>
                </div>
                <div className="space-y-3 text-xs text-purple-800 dark:text-purple-300">
                  <div>
                    <p className="font-medium mb-1">🎯 Common Issues & Solutions:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>White screen:</strong> Check browser console for errors, ensure all files are included</li>
                      <li><strong>Files not loading:</strong> Use relative paths (e.g., <code className="bg-purple-100 dark:bg-purple-900/40 px-1 rounded">./assets/</code> not <code className="bg-purple-100 dark:bg-purple-900/40 px-1 rounded">/assets/</code>)</li>
                      <li><strong>Game too slow:</strong> Reduce graphics quality, optimize assets, compress textures</li>
                      <li><strong>Controls not working:</strong> Ensure Unity Input System is configured for WebGL</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">🌐 Browser Compatibility:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>✅ Best: Chrome, Edge (Chromium), Firefox</li>
                      <li>⚠️ Limited: Safari (iOS may have issues)</li>
                      <li>❌ Not supported: Internet Explorer</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium mb-1">📦 Unity Export Tips:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Use Unity WebGL Build Settings → Player Settings</li>
                      <li>Enable compression (Brotli or Gzip)</li>
                      <li>Set "Publishing Settings" → "Compression Format"</li>
                      <li>Test locally first before uploading</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <FileWarning className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">Before Uploading:</p>
                        <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-300">
                          <li>Test game in local browser first</li>
                          <li>Verify all assets load correctly</li>
                          <li>Check file size (optimize if needed)</li>
                          <li>Ensure index.html is in root of ZIP</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface/50">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-6 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="cancel-upload-button"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!name || !description || !gameZip || uploading || name.length < 3 || description.length < 10}
            className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl disabled:shadow-none"
            data-testid="upload-submit-button"
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
