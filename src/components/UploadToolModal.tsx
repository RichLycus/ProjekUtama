import { useState, useRef } from 'react'
import { X, Upload, FileCode, AlertCircle, CheckCircle, Loader, Code2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadToolModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ExtractedMetadata {
  name: string
  category: string
  description: string
}

export default function UploadToolModal({ isOpen, onClose, onSuccess }: UploadToolModalProps) {
  const [backendFile, setBackendFile] = useState<File | null>(null)
  const [frontendFile, setFrontendFile] = useState<File | null>(null)
  const [extractedMeta, setExtractedMeta] = useState<ExtractedMetadata | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('DevTools')
  const [version, setVersion] = useState('1.0.0')
  const [author, setAuthor] = useState('Anonymous')
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const backendFileInputRef = useRef<HTMLInputElement>(null)
  const frontendFileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['Office', 'DevTools', 'Multimedia', 'Utilities', 'Security', 'Network', 'Data']

  const extractMetadata = async (fileContent: string) => {
    // Extract metadata from docstring
    const docstringMatch = fileContent.match(/"""([\s\S]*?)"""/)
    if (docstringMatch) {
      const docstring = docstringMatch[1]
      const nameMatch = docstring.match(/NAME:\s*(.+)/i)
      const catMatch = docstring.match(/CATEGORY:\s*(.+)/i)
      const descMatch = docstring.match(/DESCRIPTION:\s*(.+)/i)
      
      if (nameMatch || catMatch || descMatch) {
        const meta = {
          name: nameMatch ? nameMatch[1].trim() : '',
          category: catMatch ? catMatch[1].trim() : 'DevTools',
          description: descMatch ? descMatch[1].trim() : ''
        }
        setExtractedMeta(meta)
        if (meta.name) setName(meta.name)
        if (meta.category) setCategory(meta.category)
        if (meta.description) setDescription(meta.description)
      }
    }
  }

  const handleBackendFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.py')) {
        toast.error('Backend file must be a Python (.py) file')
        return
      }
      
      setBackendFile(selectedFile)
      
      // Read and extract metadata from backend file
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        await extractMetadata(content)
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleFrontendFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExts = ['.jsx', '.tsx', '.html', '.js']
      const hasValidExt = validExts.some(ext => selectedFile.name.endsWith(ext))
      if (!hasValidExt) {
        toast.error('Frontend file must be .jsx, .tsx, .html, or .js')
        return
      }
      
      setFrontendFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    // Validate both files are selected
    if (!backendFile) {
      toast.error('⚠️ Please select a backend file (.py)')
      return
    }

    if (!frontendFile) {
      toast.error('⚠️ Please select a frontend file (.jsx, .tsx, .html, .js)')
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

    setUploading(true)
    const toastId = toast.loading('Uploading dual tool (backend + frontend)...')

    try {
      if (window.electronAPI) {
        // Electron mode - read files and send content
        const backendContent = await backendFile.text()
        const frontendContent = await frontendFile.text()
        
        const formData = {
          backend_file: backendContent,
          backend_filename: backendFile.name,
          frontend_file: frontendContent,
          frontend_filename: frontendFile.name,
          name: name.trim(),
          description: description.trim() || name.trim(),
          category: category.trim(),
          version: version.trim(),
          author: author.trim()
        }

        const result = await window.electronAPI.uploadDualTool(formData)
        
        if (result.success) {
          setValidationResult(result.validation)
          
          if (result.validation.valid) {
            toast.success('✅ Dual tool uploaded successfully!', { id: toastId })
            setTimeout(() => {
              onSuccess()
              handleClose()
            }, 1500)
          } else {
            toast.error('⚠️ Tool uploaded but validation failed', { id: toastId })
          }
        } else {
          toast.error('❌ Upload failed: ' + result.error, { id: toastId })
        }
      } else {
        // Web mode - direct HTTP call
        const httpFormData = new FormData()
        httpFormData.append('backend_file', backendFile)
        httpFormData.append('frontend_file', frontendFile)
        httpFormData.append('name', name.trim())
        httpFormData.append('description', description.trim() || name.trim())
        httpFormData.append('category', category.trim())
        httpFormData.append('version', version.trim())
        httpFormData.append('author', author.trim())
        
        const response = await fetch('http://localhost:8001/api/tools/upload', {
          method: 'POST',
          body: httpFormData
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          setValidationResult(result.validation)
          
          if (result.validation.valid) {
            toast.success('✅ Dual tool uploaded successfully!', { id: toastId })
            setTimeout(() => {
              onSuccess()
              handleClose()
            }, 1500)
          } else {
            toast.error('⚠️ Tool uploaded but validation failed', { id: toastId })
          }
        } else {
          // Show detailed error message from backend
          const errorMsg = result.detail || result.error || result.message || 'Upload failed'
          toast.error(`❌ ${errorMsg}`, { id: toastId })
          console.error('Upload error:', result)
        }
      }
      
      setUploading(false)
    } catch (error: any) {
      toast.error('❌ Upload failed: ' + error.message, { id: toastId })
      setUploading(false)
    }
  }

  const handleClose = () => {
    setBackendFile(null)
    setFrontendFile(null)
    setExtractedMeta(null)
    setName('')
    setDescription('')
    setCategory('DevTools')
    setVersion('1.0.0')
    setAuthor('Anonymous')
    setValidationResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Upload Dual Tool</h2>
              <p className="text-sm text-secondary">Upload backend (.py) + frontend (.jsx/.tsx/.html/.js)</p>
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
              <p className="font-bold text-primary text-base mb-2">⚠️ Mandatory: Upload 2 Files</p>
              <ul className="list-disc list-inside space-y-1 text-secondary">
                <li><strong>Backend File:</strong> Python script (.py) with backend logic</li>
                <li><strong>Frontend File:</strong> UI file (.jsx, .tsx, .html, .js) for user interface</li>
              </ul>
            </div>
          </div>

          {/* Dual File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend File */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                Backend File (.py) *
              </label>
              <input
                ref={backendFileInputRef}
                type="file"
                accept=".py"
                onChange={handleBackendFileSelect}
                className="hidden"
                data-testid="backend-file-input"
              />
              <button
                onClick={() => backendFileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                data-testid="select-backend-file-button"
              >
                <FileCode className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {backendFile ? `✅ ${backendFile.name}` : 'Click to select Python file'}
                  </p>
                  {backendFile && (
                    <p className="text-xs text-secondary mt-1">
                      {(backendFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </button>
            </div>

            {/* Frontend File */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Frontend File (.jsx/.tsx/.html/.js) *
              </label>
              <input
                ref={frontendFileInputRef}
                type="file"
                accept=".jsx,.tsx,.html,.js"
                onChange={handleFrontendFileSelect}
                className="hidden"
                data-testid="frontend-file-input"
              />
              <button
                onClick={() => frontendFileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                data-testid="select-frontend-file-button"
              >
                <FileCode className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {frontendFile ? `✅ ${frontendFile.name}` : 'Click to select UI file'}
                  </p>
                  {frontendFile && (
                    <p className="text-xs text-secondary mt-1">
                      {(frontendFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Auto-extracted Metadata Notice */}
          {extractedMeta && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-500">Metadata extracted from backend file</p>
                <p className="text-secondary">Fields have been auto-filled. You can edit them below.</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tool Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CSV Converter"
                className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                data-testid="tool-name-input"
              />
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
            onClick={handleUpload}
            disabled={!backendFile || !frontendFile || uploading}
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
                Upload Tool
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
