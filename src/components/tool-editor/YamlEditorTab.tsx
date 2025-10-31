import { useState, useEffect } from 'react'
import { FileText, Save, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/backend'
import toast from 'react-hot-toast'

interface YamlEditorTabProps {
  toolId: string
  toolName: string
}

export default function YamlEditorTab({ toolId, toolName }: YamlEditorTabProps) {
  const [yamlContent, setYamlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadYamlFile()
  }, [toolId])
  
  const loadYamlFile = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.BACKEND_URL}/api/tools/${toolId}/yaml`
      )
      
      if (response.data.success) {
        setYamlContent(response.data.content)
      } else {
        setError('Failed to load YAML file')
        toast.error('Failed to load YAML file')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message
      setError(errorMsg)
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.BACKEND_URL}/api/tools/${toolId}/yaml`,
        {
          content: yamlContent
        }
      )
      
      if (response.data.success) {
        setLastSaved(new Date())
        toast.success('✅ YAML file saved successfully!')
      } else {
        toast.error('Failed to save YAML file')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message
      toast.error(`Save error: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-secondary">Loading YAML file...</p>
        </div>
      </div>
    )
  }
  
  if (error && !yamlContent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadYamlFile}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header dengan Save Button */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Tool Configuration</h3>
            <p className="text-xs text-secondary">Edit {toolName} YAML metadata</p>
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
            onClick={loadYamlFile}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-surface dark:hover:bg-dark-surface-hover rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary disabled:bg-gray-400 text-white rounded-lg transition-colors"
            data-testid="save-yaml-button"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save YAML
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* YAML Editor */}
      <div className="relative">
        <textarea
          value={yamlContent}
          onChange={(e) => setYamlContent(e.target.value)}
          className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none"
          placeholder="# Tool configuration YAML..."
          spellCheck={false}
        />
        
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
          {yamlContent.split('\n').length} lines
        </div>
      </div>
      
      {/* YAML Structure Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          📝 YAML Structure
        </h4>
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1 font-mono">
          <p>• name: Tool display name</p>
          <p>• slug: URL-friendly identifier</p>
          <p>• category: Tool category (Office, DevTools, etc)</p>
          <p>• description: Brief tool description</p>
          <p>• version: Semantic version (e.g., 1.0.0)</p>
          <p>• author: Tool author name</p>
          <p>• status: active | disabled</p>
          <p>• tool_type: dual | frontend | backend</p>
          <p>• dependencies: List of npm packages</p>
          <p>• python_dependencies: List of pip packages</p>
        </div>
      </div>
    </div>
  )
}
