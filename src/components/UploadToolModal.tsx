import { useState, useRef, useEffect } from 'react'
import { X, Upload, FileArchive, AlertCircle, CheckCircle, Loader, AlertTriangle, FolderTree } from 'lucide-react'
import toast from 'react-hot-toast'
import { BACKEND_URL } from '@/lib/backend'

interface UploadToolModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ZipContents {
  hasBackend: boolean
  hasFrontend: boolean
  backendFiles: string[]
  frontendFiles: string[]
  valid: boolean
  errors: string[]
}

interface ExistingTool {
  id: string
  name: string
  category: string
  version: string
  created_at: string
  backend_path: string
  frontend_path: string
}

interface NameCheckResult {
  exists: boolean
  slug: string
  tool?: ExistingTool
  message: string
}

export default function UploadToolModal({ isOpen, onClose, onSuccess }: UploadToolModalProps) {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [zipContents, setZipContents] = useState<ZipContents | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('DevTools')
  const [version, setVersion] = useState('1.0.0')
  const [author, setAuthor] = useState('Anonymous')
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [nameCheckResult, setNameCheckResult] = useState<NameCheckResult | null>(null)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
  const zipFileInputRef = useRef<HTMLInputElement>(null)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const categories = ['Office', 'DevTools', 'Multimedia', 'Utilities', 'Security', 'Network', 'Data', 'Converters']

  // Real-time name checking with debounce
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }

    if (!name.trim()) {
      setNameCheckResult(null)
      return
    }

    setChecking(true)
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/tools/check-name?name=${encodeURIComponent(name)}`)
        const data = await response.json()
        setNameCheckResult(data)
      } catch (error) {
        console.error('Name check failed:', error)
      } finally {
        setChecking(false)
      }
    }, 500) // Debounce 500ms

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [name])

  const validateZipStructure = (file: File): Promise<ZipContents> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          // Simple validation by checking file entries
          // For full validation, we'll let backend handle it
          const result: ZipContents = {
            hasBackend: true,  // Assume valid, backend will validate
            hasFrontend: true,
            backendFiles: [],
            frontendFiles: [],
            valid: true,
            errors: []
          }
          
          resolve(result)
        } catch (error) {
          resolve({
            hasBackend: false,
            hasFrontend: false,
            backendFiles: [],
            frontendFiles: [],
            valid: false,
            errors: ['Failed to read ZIP file']
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          hasBackend: false,
          hasFrontend: false,
          backendFiles: [],
          frontendFiles: [],
          valid: false,
          errors: ['Failed to read ZIP file']
        })
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  const handleZipFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        toast.error('File must be a ZIP archive (.zip)')
        return
      }
      
      setZipFile(selectedFile)
      
      // Validate ZIP structure
      const contents = await validateZipStructure(selectedFile)
      setZipContents(contents)
      
      // Auto-extract tool name from ZIP filename (remove .zip extension)
      const zipName = selectedFile.name.replace('.zip', '')
      if (!name) {
        setName(zipName)
      }
    }
  }

  const handleUpload = async (forceOverwrite = false) => {
    // Validate ZIP file selected
    if (!zipFile) {
      toast.error('⚠️ Please select a ZIP file')
      return
    }

    if (!name.trim()) {
      toast.error('⚠️ Please enter a tool name')
      return
    }

    if (!category.trim()) {
      toast.error('⚠️ Please select a category')
      return
    }

    if (!version.trim()) {
      toast.error('⚠️ Version cannot be empty')
      return
    }

    if (!author.trim()) {
      toast.error('⚠️ Author cannot be empty')
      return
    }

    // If name exists and not forcing overwrite, show confirmation
    if (nameCheckResult?.exists && !forceOverwrite) {
      setShowOverwriteConfirm(true)
      return
    }

    setUploading(true)
    const toastId = toast.loading('📦 Uploading ZIP archive...')

    try {
      const formData = new FormData()
      formData.append('file', zipFile)
      formData.append('name', name.trim())
      formData.append('description', description.trim() || name.trim())
      formData.append('category', category.trim())
      formData.append('version', version.trim())
      formData.append('author', author.trim())
      formData.append('force_overwrite', forceOverwrite.toString())
      
      const response = await fetch(`${BACKEND_URL}/api/tools/upload-zip`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setValidationResult(result.validation)
        
        const message = result.overwritten 
          ? `✅ Tool "${result.slug}" berhasil diperbarui!` 
          : `✅ Tool "${result.slug}" berhasil diupload!`
        
        if (result.validation.valid) {
          toast.success(message, { id: toastId })
          setTimeout(() => {
            onSuccess()
            handleClose()
          }, 1500)
        } else {
          toast.error('⚠️ Tool uploaded but validation failed', { id: toastId })
        }
      } else {
        // Handle validation errors from backend
        const errorMsg = result.detail?.error || result.detail || result.error || 'Upload failed'
        const details = result.detail?.details || []
        
        if (details.length > 0) {
          toast.error(
            <div>
              <p className="font-bold">{errorMsg}</p>
              <ul className="text-xs mt-1">
                {details.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>,
            { id: toastId, duration: 5000 }
          )
        } else {
          toast.error(`❌ ${errorMsg}`, { id: toastId })
        }
        
        console.error('Upload error:', result)
      }
      
      setUploading(false)
      setShowOverwriteConfirm(false)
    } catch (error: any) {
      toast.error('❌ Upload failed: ' + error.message, { id: toastId })
      setUploading(false)
      setShowOverwriteConfirm(false)
    }
  }

  const handleClose = () => {
    setZipFile(null)
    setZipContents(null)
    setName('')
    setDescription('')
    setCategory('DevTools')
    setVersion('1.0.0')
    setAuthor('Anonymous')
    setValidationResult(null)
    setNameCheckResult(null)
    setShowOverwriteConfirm(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Upload Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Upload Tool (ZIP Archive)</h2>
                <p className="text-sm text-secondary">Upload tool as single ZIP file</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
              data-testid="close-upload-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Important Notice */}
            <div className="flex items-start gap-3 p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-primary text-base mb-2">📦 ZIP Structure Required</p>
                <div className="bg-black/20 rounded-lg p-3 font-mono text-xs mt-2">
                  <div className="text-secondary">tool-name.zip</div>
                  <div className="ml-3">├── <span className="text-primary">backend/</span></div>
                  <div className="ml-6">└── main.py <span className="text-yellow-500">(exactly 1 .py file)</span></div>
                  <div className="ml-3">└── <span className="text-primary">frontend/</span></div>
                  <div className="ml-6">└── Component.tsx <span className="text-yellow-500">(exactly 1 file)</span></div>
                </div>
              </div>
            </div>

            {/* ZIP File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-primary" />
                ZIP Archive (.zip) *
              </label>
              <input
                ref={zipFileInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipFileSelect}
                className="hidden"
                data-testid="zip-file-input"
              />
              <button
                onClick={() => zipFileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                data-testid="select-zip-file-button"
              >
                <FileArchive className={`w-12 h-12 ${zipFile ? 'text-green-500' : 'text-primary'}`} />
                <div className="text-center">
                  {zipFile ? (
                    <>
                      <p className="font-medium text-sm text-green-600 dark:text-green-500">
                        ✅ {zipFile.name}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        {(zipFile.size / 1024).toFixed(2)} KB
                      </p>
                      {zipContents && zipContents.valid && (
                        <div className="mt-3 p-3 bg-green-500/10 rounded-lg text-left">
                          <p className="text-xs font-medium text-green-600 dark:text-green-500 mb-2">
                            <FolderTree className="w-3 h-3 inline-block mr-1" />
                            ZIP akan divalidasi oleh backend
                          </p>
                          <p className="text-xs text-secondary">
                            Pastikan struktur ZIP sesuai (backend/ dan frontend/ folders)
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Click to select ZIP file</p>
                      <p className="text-xs text-secondary mt-1">
                        or drag and drop here
                      </p>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Tool Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., JSON Formatter"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    data-testid="tool-name-input"
                  />
                  {checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                {/* Name Check Result */}
                {nameCheckResult && (
                  <div className="mt-2">
                    {nameCheckResult.exists ? (
                      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm flex-1">
                          <p className="font-medium text-yellow-600 dark:text-yellow-500">⚠️ Nama sudah digunakan</p>
                          <p className="text-xs text-secondary mt-1">
                            Tool <strong>"{nameCheckResult.tool?.name}"</strong> akan disimpan sebagai: <strong className="text-primary">{nameCheckResult.slug}</strong>
                          </p>
                          <p className="text-xs text-secondary mt-1">
                            Tool directory existing akan diganti saat upload.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-green-600 dark:text-green-500">✅ Nama tersedia</p>
                          <p className="text-xs text-secondary mt-1">
                            Tool akan disimpan dengan slug: <strong className="text-primary">{nameCheckResult.slug}</strong>
                          </p>
                          <p className="text-xs text-secondary mt-1 font-mono">
                            sample_tools/{category.toLowerCase()}/{nameCheckResult.slug}/
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  data-testid="tool-category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Version *</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  data-testid="tool-version-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Author *</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  data-testid="tool-author-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this tool does..."
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
                data-testid="tool-description-input"
              />
            </div>

            {/* Validation Result */}
            {validationResult && !validationResult.valid && (
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-500">Validation Failed</p>
                    {validationResult.backend && !validationResult.backend.valid && (
                      <div className="mt-2">
                        <p className="font-semibold text-red-500">Backend Errors:</p>
                        <ul className="list-disc list-inside text-secondary">
                          {validationResult.backend.errors.map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.frontend && !validationResult.frontend.valid && (
                      <div className="mt-2">
                        <p className="font-semibold text-red-500">Frontend Errors:</p>
                        <ul className="list-disc list-inside text-secondary">
                          {validationResult.frontend.errors.map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-secondary">Tool will be uploaded with 'disabled' status. You can fix issues later.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
              disabled={uploading}
              data-testid="cancel-upload-button"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpload(false)}
              disabled={!zipFile || uploading}
              className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              data-testid="upload-button"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {nameCheckResult?.exists ? 'Update Tool' : 'Upload Tool'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overwrite Confirmation Modal */}
      {showOverwriteConfirm && nameCheckResult?.tool && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl w-full max-w-md m-4 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">⚠️ Tool Sudah Ada</h3>
                <p className="text-sm text-secondary">
                  Tool dengan nama ini sudah ada. Tool directory lama akan dihapus dan diganti dengan ZIP baru.
                </p>
              </div>
            </div>

            <div className="bg-dark-surface/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Nama:</span>
                <span className="font-medium">{nameCheckResult.tool.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Slug:</span>
                <span className="font-mono text-primary">{nameCheckResult.slug}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Category:</span>
                <span className="font-medium">{nameCheckResult.tool.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Version:</span>
                <span className="font-medium">{nameCheckResult.tool.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Dibuat:</span>
                <span className="font-medium">
                  {new Date(nameCheckResult.tool.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Tool directory akan dihapus:
              </p>
              <p className="text-xs text-secondary mt-2 font-mono">
                sample_tools/{nameCheckResult.tool.category.toLowerCase()}/{nameCheckResult.slug}/
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                onClick={() => handleUpload(true)}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Ganti Tool'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
