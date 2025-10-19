import { useState, useEffect } from 'react'
import { X, Save, Zap, Brain, Gauge } from 'lucide-react'
import { useAIModelsStore } from '@/store/aiModelsStore'
import toast from 'react-hot-toast'

interface AgentConfig {
  id: string
  agent_type: string
  model_name: string
  display_name: string
  description: string
  is_enabled: number
  temperature: number
  max_tokens: number
}

interface EditAgentModalProps {
  isOpen: boolean
  onClose: () => void
  agent: AgentConfig | null
  onSave: (agentId: string, updates: any) => Promise<boolean>
}

export default function EditAgentModal({ isOpen, onClose, agent, onSave }: EditAgentModalProps) {
  const { models, loadModels } = useAIModelsStore()
  
  const [selectedModel, setSelectedModel] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Load models on mount
  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen, loadModels])

  // Set initial values when agent changes
  useEffect(() => {
    if (agent) {
      setSelectedModel(agent.model_name)
      setTemperature(agent.temperature)
      setMaxTokens(agent.max_tokens)
      setDescription(agent.description)
    }
  }, [agent])

  const handleSave = async () => {
    if (!agent) return

    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }

    setSaving(true)
    const updates = {
      model_name: selectedModel,
      temperature: temperature,
      max_tokens: maxTokens,
      description: description
    }

    const success = await onSave(agent.id, updates)
    setSaving(false)

    if (success) {
      onClose()
    }
  }

  if (!isOpen || !agent) return null

  // Agent type icons and colors
  const agentStyles: Record<string, { icon: string; color: string; bgColor: string }> = {
    router: { icon: '🧭', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    rag: { icon: '📚', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    chat: { icon: '💬', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    code: { icon: '💻', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    analysis: { icon: '📊', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    creative: { icon: '🎨', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
    tool: { icon: '🔧', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    execution: { icon: '⚡', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    reasoning: { icon: '🧠', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
    persona: { icon: '🎭', color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' }
  }

  const style = agentStyles[agent.agent_type] || { icon: '🤖', color: 'text-gray-600', bgColor: 'bg-gray-100' }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${style.bgColor} flex items-center justify-center text-2xl`}>
              {style.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{agent.display_name}</h2>
              <p className="text-sm text-secondary">
                Configure <span className={`font-medium ${style.color}`}>{agent.agent_type}</span> agent settings
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
          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Brain className="w-4 h-4 text-primary" />
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface-hover border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.model_name}>
                  {model.display_name} ({model.model_name})
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary mt-2">
              Choose which Ollama model this agent should use
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Gauge className="w-4 h-4 text-primary" />
              Temperature: <span className="text-primary">{temperature.toFixed(2)}</span>
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-dark-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-secondary">
                <span>0.0 - Deterministic</span>
                <span>0.5 - Balanced</span>
                <span>1.0 - Creative</span>
              </div>
            </div>
            <p className="text-xs text-secondary mt-2">
              Controls randomness: lower = more focused, higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Zap className="w-4 h-4 text-primary" />
              Max Tokens: <span className="text-primary">{maxTokens}</span>
            </label>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-dark-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-secondary mt-2">
              <span>500 - Short</span>
              <span>2000 - Medium</span>
              <span>4000 - Long</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Maximum length of responses (higher = longer but slower)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-3 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface-hover border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Describe what this agent specializes in..."
            />
            <p className="text-xs text-secondary mt-2">
              Optional: Add or update the agent's description
            </p>
          </div>

          {/* Info Box */}
          <div className={`p-4 rounded-xl ${style.bgColor} border border-gray-200 dark:border-dark-border`}>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">{style.icon}</span>
              Agent Info
            </h4>
            <p className="text-sm text-secondary">
              <strong>Type:</strong> {agent.agent_type} <br />
              <strong>Status:</strong> {agent.is_enabled === 1 ? '✅ Enabled' : '❌ Disabled'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-surface-hover border-t border-gray-200 dark:border-dark-border p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-border rounded-xl font-medium transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedModel}
            className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
