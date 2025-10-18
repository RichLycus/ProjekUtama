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

type ToolType = 'backend' | 'frontend'

export default function UploadToolModal({ isOpen, onClose, onSuccess }: UploadToolModalProps) {
  const [toolType, setToolType] = useState<ToolType>('backend')
  const [file, setFile] = useState<File | null>(null)
  const [extractedMeta, setExtractedMeta] = useState<ExtractedMetadata | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('DevTools')
  const [version, setVersion] = useState('1.0.0')
  const [author, setAuthor] = useState('Anonymous')
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate based on tool type
      if (toolType === 'backend' && !selectedFile.name.endsWith('.py')) {
        toast.error('Please select a Python (.py) file for backend tools')
        return
      }
      
      if (toolType === 'frontend') {
        const validExts = ['.jsx', '.tsx', '.html', '.js']
        const hasValidExt = validExts.some(ext => selectedFile.name.endsWith(ext))
        if (!hasValidExt) {
          toast.error('Please select a .jsx, .tsx, .html, or .js file for frontend tools')
          return
        }
      }
      
      setFile(selectedFile)
      
      // Read and extract metadata
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        await extractMetadata(content)
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a tool name')
      return
    }

    // Validasi field wajib lainnya untuk mencegah error 402
    if (!category.trim()) {
      toast.error('⚠️ Please select a category')
      return
    }

    if (!version.trim()) {
      toast.error('⚠️ Version cannot be empty. Please enter a version (e.g., 1.0.0)')
      return
    }

    if (!author.trim()) {
      toast.error('⚠️ Author cannot be empty. Please enter author name')
      return
    }

    setUploading(true)
    const toastId = toast.loading(`Uploading ${toolType} tool...`)

    try {
      // Read file content
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        
        // Prepare form data
        const formData = {
          file: content,
          name: name.trim(),
          description: description.trim() || name.trim(),
          category: category.trim(),
          version: version.trim(),
          author: author.trim(),
          tool_type: toolType
        }

        if (window.electronAPI) {
          // Use universal API endpoint for both backend and frontend tools
          const result = await window.electronAPI.uploadTool(formData)
          
          if (result.success) {
            setValidationResult(result.validation)
            
            if (result.validation.valid) {
              toast.success(`✅ ${toolType === 'backend' ? 'Backend' : 'Frontend'} tool uploaded successfully!`, { id: toastId })
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
          // Web mode fallback - direct HTTP call to universal API
          const httpFormData = new FormData()
          httpFormData.append('file', file)
          httpFormData.append('name', formData.name)
          httpFormData.append('description', formData.description)
          httpFormData.append('category', formData.category)
          httpFormData.append('version', formData.version)
          httpFormData.append('author', formData.author)
          
          const response = await fetch('http://localhost:8001/api/tools/upload', {
            method: 'POST',
            body: httpFormData
          })
          
          const result = await response.json()
          
          if (result.success) {
            setValidationResult(result.validation)
            
            if (result.validation.valid) {
              toast.success(`✅ ${toolType === 'backend' ? 'Backend' : 'Frontend'} tool uploaded successfully!`, { id: toastId })
              setTimeout(() => {
                onSuccess()
                handleClose()
              }, 1500)
            } else {
              toast.error('⚠️ Tool uploaded but validation failed', { id: toastId })
            }
          } else {
            toast.error('❌ Upload failed', { id: toastId })
          }
        }
        
        setUploading(false)
      }
      
      reader.readAsText(file)
    } catch (error: any) {
      toast.error('❌ Upload failed: ' + error.message, { id: toastId })
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
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
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Upload Tool</h2>
              <p className="text-sm text-secondary">Add a new tool to your library</p>
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

        {/* Tool Type Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => {
              setToolType('backend')
              setFile(null)
              setValidationResult(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              toolType === 'backend'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
            }`}
            data-testid="backend-tab"
          >
            <Code2 className="w-4 h-4" />
            Backend Tool (Python)
          </button>
          <button
            onClick={() => {
              setToolType('frontend')
              setFile(null)
              setValidationResult(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              toolType === 'frontend'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
            }`}
            data-testid="frontend-tab"
          >
            <FileText className="w-4 h-4" />
            Frontend Tool (React/HTML)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description based on tool type */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">
                {toolType === 'backend' ? 'Backend Tools' : 'Frontend Tools'}
              </p>
              <p className="text-secondary">
                {toolType === 'backend' 
                  ? 'Upload Python (.py) scripts that will be executed on the backend server.' 
                  : 'Upload React components (.jsx, .tsx), JavaScript (.js), or HTML (.html) mini-apps that will run in the UI.'}
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {toolType === 'backend' ? 'Python Script File *' : 'Frontend File *'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={toolType === 'backend' ? '.py' : '.jsx,.tsx,.html,.js'}
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
              data-testid="select-file-button"
            >
              <FileCode className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file ? file.name : `Click to select ${toolType} file`}</p>
                <p className="text-xs text-secondary">
                  {file 
                    ? `${(file.size / 1024).toFixed(2)} KB` 
                    : toolType === 'backend' 
                      ? 'Only .py files are allowed' 
                      : 'Allowed: .jsx, .tsx, .html, .js'}
                </p>
              </div>
            </button>
          </div>

          {/* Auto-extracted Metadata Notice */}
          {extractedMeta && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-500">Metadata extracted from script</p>
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
              placeholder="Describe what this tool does... (Optional - will use tool name if empty)"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
              data-testid="tool-description-input"
            />
            <p className="text-xs text-secondary mt-1">💡 Tip: If left empty, tool name will be used as description</p>
          </div>

          {/* Validation Result */}
          {validationResult && !validationResult.valid && (
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-500">Validation Failed</p>
                  <ul className="list-disc list-inside mt-2 text-secondary space-y-1">
                    {validationResult.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                  {validationResult.dependencies?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-secondary">Dependencies found:</p>
                      <p className="text-primary text-xs">{validationResult.dependencies.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-secondary">Tool will be uploaded with 'disabled' status. You can install dependencies later.</p>
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
            disabled={!file || uploading}
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