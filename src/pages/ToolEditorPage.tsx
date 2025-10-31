import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Code, Save, RefreshCw, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, FileText, Package } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/backend'
import toast from 'react-hot-toast'
import axios from 'axios'
import MonacoEditorPanel from '@/components/tool-editor/MonacoEditorPanel'
import PreviewPanel from '@/components/tool-editor/PreviewPanel'
import DependenciesTab from '@/components/tool-editor/DependenciesTab'
import YamlEditorTab from '@/components/tool-editor/YamlEditorTab'
import { useLocation } from 'react-router-dom'

type TabType = 'settings' | 'editor'

export default function ToolEditorPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if URL has ?tab=settings query param
  const urlParams = new URLSearchParams(location.search)
  const initialTab = urlParams.get('tab') === 'settings' ? 'settings' : 'editor'
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [tool, setTool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Editor state
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Preview state
  const [previewMode, setPreviewMode] = useState<'static' | 'full'>('static')
  const [previewKey, setPreviewKey] = useState(0)
  
  // Load tool data
  useEffect(() => {
    if (toolId) {
      loadToolData()
    }
  }, [toolId])
  
  const loadToolData = async () => {
    setLoading(true)
    try {
      // Load tool info
      const toolsResponse = await axios.get(`${API_ENDPOINTS.BACKEND_URL}/api/tools`)
      const toolData = toolsResponse.data.tools.find((t: any) => t._id === toolId)
      
      if (toolData) {
        setTool(toolData)
        
        // Load tool code
        const codeResponse = await axios.get(
          `${API_ENDPOINTS.BACKEND_URL}/api/tools/file/${toolId}?file_type=frontend`
        )
        
        if (codeResponse.data.success) {
          setCode(codeResponse.data.content)
        } else {
          toast.error('Failed to load tool code')
        }
      } else {
        toast.error('Tool not found')
        navigate('/settings')
      }
    } catch (error: any) {
      console.error('Failed to load tool:', error)
      toast.error(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    if (!toolId) return
    
    // Validasi: pastikan code tidak kosong
    if (!code || code.trim().length === 0) {
      toast.error('⚠️ Cannot save empty file!')
      return
    }
    
    setSaving(true)
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.BACKEND_URL}/api/tools/file/${toolId}`,
        {
          file_type: 'frontend',
          content: code
        }
      )
      
      if (response.data.success) {
        setLastSaved(new Date())
        toast.success('✅ Code saved successfully!')
        // NOTE: Preview refresh dihapus dari sini untuk menghindari double render
      } else {
        toast.error('Failed to save code')
      }
    } catch (error: any) {
      console.error('Failed to save:', error)
      toast.error(`Save error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleRebuild = async () => {
    if (!toolId) return
    
    setRebuilding(true)
    const toastId = toast.loading('🔨 Rebuilding tool...')
    
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.BACKEND_URL}/api/tools/rebuild/${toolId}`
      )
      
      if (response.data.success) {
        toast.success('✅ Tool rebuilt successfully!', { id: toastId })
        
        // Refresh preview HANYA sekali setelah rebuild selesai
        setTimeout(() => {
          setPreviewKey(prev => prev + 1)
        }, 1000)
      } else {
        toast.error(`Build failed: ${response.data.message}`, { id: toastId })
      }
    } catch (error: any) {
      console.error('Failed to rebuild:', error)
      toast.error(`Rebuild error: ${error.response?.data?.detail || error.message}`, { id: toastId })
    } finally {
      setRebuilding(false)
    }
  }
  
  const handleSaveAndRebuild = async () => {
    // Validasi sebelum save & rebuild
    if (!code || code.trim().length === 0) {
      toast.error('⚠️ Cannot save empty file!')
      return
    }
    
    // Save dulu
    await handleSave()
    
    // Tunggu save selesai, baru rebuild
    setTimeout(() => {
      handleRebuild()
    }, 800)
    // NOTE: Preview hanya di-refresh SEKALI oleh handleRebuild() untuk menghindari double render
  }
  
  if (loading) {
    return (
      <div className="h-[calc(100vh-5.5rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-secondary">Loading tool editor...</p>
        </div>
      </div>
    )
  }
  
  if (!tool) {
    return (
      <div className="h-[calc(100vh-5.5rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-secondary">Tool not found</p>
          <button
            onClick={() => navigate('/settings')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Settings
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col" data-testid="tool-editor-page">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-bold">Tool Editor</h1>
              <p className="text-sm text-secondary">{tool.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              data-testid="save-button"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            
            <button
              onClick={handleSaveAndRebuild}
              disabled={saving || rebuilding}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              data-testid="save-rebuild-button"
            >
              {rebuilding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Save & Rebuild
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-primary text-white'
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
            }`}
            data-testid="tab-settings"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-primary text-white'
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
            }`}
            data-testid="tab-editor"
          >
            <Code className="w-4 h-4" />
            Code Editor
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'settings' ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* YAML Editor Section */}
              <div className="glass rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Tool Configuration (YAML)
                </h2>
                <YamlEditorTab toolId={toolId!} toolName={tool.name} />
              </div>
              
              {/* Dependencies Section */}
              <div className="glass rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Dependencies Management
                </h2>
                <DependenciesTab toolId={toolId!} toolName={tool.name} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex gap-4 p-4">
            {/* Monaco Editor */}
            <div className="flex-1 flex flex-col">
              <MonacoEditorPanel
                code={code}
                onChange={setCode}
                language="typescript"
                theme="vs-dark"
              />
            </div>
            
            {/* Preview Panel */}
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode('static')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                      previewMode === 'static'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-surface-hover'
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    Static
                  </button>
                  <button
                    onClick={() => setPreviewMode('full')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                      previewMode === 'full'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-surface-hover'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Full
                  </button>
                </div>
              </div>
              
              <PreviewPanel
                toolId={toolId!}
                mode={previewMode}
                rebuilding={rebuilding}
                refreshKey={previewKey}
                key={previewKey}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
