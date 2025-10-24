import { Slider } from '@/components/ui/slider'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface AgentConfig {
  id: string
  agent_type: string
  model_name: string
  display_name: string
  description: string
  temperature: number
  max_tokens: number
  system_prompt: string
  is_enabled: number
}

interface LLMAgentConfigProps {
  config: {
    agent_id?: string
    model_name?: string
    temperature?: number
    max_tokens?: number
    description?: string
    system_prompt?: string
  }
  onChange: (config: any) => void
}

export default function LLMAgentConfig({ config, onChange }: LLMAgentConfigProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)

  // Fetch agents from database
  const fetchAgents = async () => {
    setLoading(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || ''
      const response = await fetch(`${backendUrl}/api/agents/configs`)
      const data = await response.json()
      
      if (data.success && data.configs) {
        // Filter only LLM agents (exclude router, rag, tool)
        const llmAgents = data.configs.filter((a: AgentConfig) => 
          a.is_enabled === 1 && 
          !['router', 'rag', 'tool'].includes(a.agent_type)
        )
        setAgents(llmAgents)
        
        // Set initial selected agent
        if (config.agent_id) {
          const agent = llmAgents.find((a: AgentConfig) => a.id === config.agent_id)
          setSelectedAgent(agent || llmAgents[0])
        } else {
          setSelectedAgent(llmAgents[0])
        }
      } else {
        toast.error('Failed to load agents')
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // Current values with fallback to selected agent defaults
  const temperature = config.temperature ?? selectedAgent?.temperature ?? 0.7
  const maxTokens = config.max_tokens ?? selectedAgent?.max_tokens ?? 2000
  const description = config.description || selectedAgent?.description || ''
  const systemPrompt = config.system_prompt || selectedAgent?.system_prompt || ''

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      setSelectedAgent(agent)
      onChange({
        ...config,
        agent_id: agent.id,
        model_name: agent.model_name,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        description: agent.description,
        system_prompt: agent.system_prompt
      })
    }
  }

  const handleTemperatureChange = (value: number[]) => {
    onChange({ ...config, temperature: value[0] })
  }

  const handleMaxTokensChange = (value: number[]) => {
    onChange({ ...config, max_tokens: value[0] })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, description: e.target.value })
  }

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...config, system_prompt: e.target.value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading agents...</span>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No agents available</p>
        <button
          onClick={fetchAgents}
          className="mt-4 text-primary hover:underline flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            AI Model
          </span>
          <button
            onClick={fetchAgents}
            className="text-xs text-primary hover:underline flex items-center gap-1"
            title="Refresh agents"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </label>
        <select
          value={selectedAgent?.id || ''}
          onChange={(e) => handleAgentChange(e.target.value)}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
        >
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.display_name} ({agent.model_name})
            </option>
          ))}
        </select>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Choose which Ollama model this agent should use
        </p>
      </div>

      {/* Temperature Slider */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span>Temperature: {temperature.toFixed(2)}</span>
        </label>
        <Slider
          value={[temperature]}
          onValueChange={handleTemperatureChange}
          min={0}
          max={1}
          step={0.05}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0.0 - Deterministic</span>
          <span>0.5 - Balanced</span>
          <span>1.0 - Creative</span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Controls randomness: lower = more focused, higher = more creative
        </p>
      </div>

      {/* Max Tokens Slider */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span>Max Tokens: {maxTokens}</span>
        </label>
        <Slider
          value={[maxTokens]}
          onValueChange={handleMaxTokensChange}
          min={500}
          max={4000}
          step={100}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>500 - Short</span>
          <span>2000 - Medium</span>
          <span>4000 - Long</span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Maximum length of responses (higher = longer but slower)
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
          placeholder="Enter agent description"
        />
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Optional: Add or update the agent's description
        </p>
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          rows={6}
          className="
            w-full px-3 py-2 rounded-lg border-2 border-blue-300 dark:border-blue-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors resize-none
          "
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  )
}
