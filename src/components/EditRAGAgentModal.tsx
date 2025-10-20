import { useState, useEffect } from 'react'
import { X, Save, Download, TestTube, CheckCircle2, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmbeddingModel {
  model_id: string
  display_name: string
  description: string
  size_mb: number
  dimension: number
  speed: string
  accuracy: string
  recommended: boolean
  vram_usage: string
  is_downloaded?: boolean
}

interface AgentConfig {
  id: string
  agent_type: string
  model_name: string
  display_name: string
  description: string
  is_enabled: number
}

interface EditRAGAgentModalProps {
  isOpen: boolean
  onClose: () => void
  agent: AgentConfig | null
  onSave: (agentId: string, updates: any) => Promise<boolean>
}

export default function EditRAGAgentModal({ isOpen, onClose, agent, onSave }: EditRAGAgentModalProps) {
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

  // Load embedding models on mount
  useEffect(() => {
    if (isOpen) {
      loadEmbeddingModels()
    }
  }, [isOpen])

  // Set initial model when agent changes
  useEffect(() => {
    if (agent) {
      setSelectedModel(agent.model_name)
    }
  }, [agent])

  const loadEmbeddingModels = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${backendUrl}/api/embeddings/models/list`)
      const data = await response.json()
      
      if (data.success) {
        setEmbeddingModels(data.models)
      } else {
        toast.error('❌ Failed to load embedding models')
      }
    } catch (error) {
      console.error('Failed to load embedding models:', error)
      toast.error('❌ Failed to load embedding models')
    } finally {
      setLoading(false)
    }
  }

  const handleTestModel = async (modelId: string) => {
    setTesting(modelId)
    setTestResults(null)
    
    const toastId = toast.loading(`Testing ${modelId}...`)
    
    try {
      const response = await fetch(`${backendUrl}/api/embeddings/models/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 5000 })
        setTestResults(data.test_results)
        // Reload models to update download status
        loadEmbeddingModels()
      } else {
        toast.error(data.message || '❌ Test failed', { id: toastId })
      }
    } catch (error) {
      console.error('Test failed:', error)
      toast.error('❌ Test failed', { id: toastId })
    } finally {
      setTesting(null)
    }
  }

  const handleDownloadModel = async (modelId: string) => {
    setDownloading(modelId)
    
    const toastId = toast.loading(`Downloading ${modelId}...`)
    
    try {
      const response = await fetch(`${backendUrl}/api/embeddings/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message, { id: toastId })
        // Reload models to update download status
        loadEmbeddingModels()
      } else {
        toast.error('❌ Download failed', { id: toastId })
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('❌ Download failed', { id: toastId })
    } finally {
      setDownloading(null)
    }
  }

  const handleSave = async () => {
    if (!agent || !selectedModel) {
      toast.error('Please select a model')
      return
    }

    setLoading(true)
    const updates = {
      model_name: selectedModel
    }

    const success = await onSave(agent.id, updates)
    setLoading(false)

    if (success) {
      onClose()
    }
  }

  if (!isOpen || !agent) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
              📚
            </div>
            <div>
              <h2 className="text-2xl font-bold">{agent.display_name}</h2>
              <p className="text-sm text-secondary">
                Configure embedding model for RAG system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>RAG Agent berbeda!</strong> Menggunakan embedding model dari HuggingFace, bukan Ollama.
                Model ini mengubah text menjadi vector untuk context retrieval.
              </div>
            </div>
          </div>

          {/* Current Model */}
          <div className="p-4 bg-gray-50 dark:bg-dark-surface-hover rounded-xl">
            <h4 className="font-semibold mb-2">Current Embedding Model</h4>
            <p className="text-sm text-secondary">
              <strong>Model:</strong> {agent.model_name}
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <h3 className="text-lg font-bold mb-4">Available Embedding Models</h3>
            
            {loading && embeddingModels.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {embeddingModels.map((model) => (
                  <div
                    key={model.model_id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedModel === model.model_id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Radio Button */}
                      <input
                        type="radio"
                        name="embedding_model"
                        checked={selectedModel === model.model_id}
                        onChange={() => setSelectedModel(model.model_id)}
                        className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                      />
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {model.display_name}
                              {model.recommended && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                                  ⭐ Recommended
                                </span>
                              )}
                              {model.is_downloaded && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Downloaded
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-secondary mt-1">{model.description}</p>
                          </div>
                        </div>
                        
                        {/* Specs */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                            📦 {model.size_mb} MB
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                            📐 {model.dimension}D
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                            ⚡ {model.speed}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                            🎯 {model.accuracy}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                            💾 VRAM: {model.vram_usage}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTestModel(model.model_id)}
                            disabled={testing === model.model_id}
                            className="px-3 py-2 text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            {testing === model.model_id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube className="w-3 h-3" />
                                Test Model
                              </>
                            )}
                          </button>
                          
                          {!model.is_downloaded && (
                            <button
                              onClick={() => handleDownloadModel(model.model_id)}
                              disabled={downloading === model.model_id}
                              className="px-3 py-2 text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              {downloading === model.model_id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3" />
                                  Download
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Test Results
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-secondary">Load Time:</span>
                  <span className="ml-2 font-medium">{testResults.load_time_seconds}s</span>
                </div>
                <div>
                  <span className="text-secondary">Encode Time:</span>
                  <span className="ml-2 font-medium">{testResults.encode_time_seconds}s</span>
                </div>
                <div>
                  <span className="text-secondary">Dimension:</span>
                  <span className="ml-2 font-medium">{testResults.embedding_dimension}</span>
                </div>
                <div>
                  <span className="text-secondary">Device:</span>
                  <span className="ml-2 font-medium">{testResults.device.toUpperCase()}</span>
                </div>
                {testResults.vram_used_mb && (
                  <div>
                    <span className="text-secondary">VRAM Used:</span>
                    <span className="ml-2 font-medium">{testResults.vram_used_mb} MB</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-surface-hover border-t border-gray-200 dark:border-dark-border p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-border rounded-xl font-medium transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedModel}
            className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Model
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
