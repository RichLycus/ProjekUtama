import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Wrench, Palette, Info, Plus, Search, Sun, Moon, HelpCircle, MessageSquare, Edit2, Trash2, Star, TestTube, Users, Power, RefreshCw, Info as InfoIcon, Gamepad2 } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import { useThemeStore } from '@/store/themeStore'
import { useAIConfigStore } from '@/store/aiConfigStore'
import { useAIModelsStore } from '@/store/aiModelsStore'
import { API_ENDPOINTS } from '@/lib/backend'
import ToolsTable from '@/components/ToolsTable'
import UploadToolModal from '@/components/UploadToolModal'
import UploadGameModal from '@/components/UploadGameModal'
import ToolSettingsModal from '@/components/ToolSettingsModal'
import HelpModal from '@/components/HelpModal'
import ThemeCard from '@/components/ThemeCard'
import PersonaManager from '@/components/PersonaManager'
import EditAgentModal from '@/components/EditAgentModal'
import EditRAGAgentModal from '@/components/EditRAGAgentModal'
import SystemHealthMonitor from '@/components/SystemHealthMonitor'
import toast from 'react-hot-toast'

type TabType = 'tools' | 'appearance' | 'ai-chat' | 'personas' | 'games' | 'about'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tools')
  
  // Games state
  const [isUploadGameModalOpen, setIsUploadGameModalOpen] = useState(false)
  const [games, setGames] = useState<any[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  
  // AI Config state
  const { config, loadConfig, saveConfig, testConnection } = useAIConfigStore()
  const { models, loadModels, addModel, updateModel, deleteModel, setDefaultModel, testModel } = useAIModelsStore()
  
  const [ollamaUrl, setOllamaUrl] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [contextSize, setContextSize] = useState(4000)
  const [executionEnabled, setExecutionEnabled] = useState(true)
  const [executionPolicy, setExecutionPolicy] = useState('ask')
  
  // Model management state
  const [showAddModel, setShowAddModel] = useState(false)
  const [editingModelId, setEditingModelId] = useState<string | null>(null)
  const [newModelName, setNewModelName] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  
  // Agent configs state
  const [agentConfigs, setAgentConfigs] = useState<any[]>([])
  const [editingAgent, setEditingAgent] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRAGModalOpen, setIsRAGModalOpen] = useState(false)
  
  // Load AI config and models on mount
  useEffect(() => {
    loadConfig()
    loadModels()
  }, [])
  
  // Update local state when config loads
  useEffect(() => {
    if (config) {
      setOllamaUrl(config.ollama_url)
      setContextSize(config.context_window_size)
      setExecutionEnabled(config.execution_enabled)
      setExecutionPolicy(config.execution_policy)
      
      // Find model ID that matches config.model
      const matchingModel = models.find(m => m.model_name === config.model)
      if (matchingModel) {
        setSelectedModelId(matchingModel.id)
      }
    }
  }, [config, models])
  
  // Save AI config handler
  const handleSaveAIConfig = async () => {
    // Get selected model's model_name
    const selectedModel = models.find(m => m.id === selectedModelId)
    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }
    
    const success = await saveConfig({
      ollama_url: ollamaUrl,
      model: selectedModel.model_name,
      context_window_size: contextSize,
      execution_enabled: executionEnabled,
      execution_policy: executionPolicy
    })
    
    if (success) {
      loadConfig()
    }
  }
  
  // Test connection handler
  const handleTestConnection = async () => {
    await testConnection()
  }
  
  // Add model handler
  const handleAddModel = async () => {
    if (!newModelName || !newDisplayName) {
      toast.error('Please fill in model name and display name')
      return
    }
    
    const success = await addModel(newModelName, newDisplayName, newDescription)
    if (success) {
      setShowAddModel(false)
      setNewModelName('')
      setNewDisplayName('')
      setNewDescription('')
    }
  }
  
  // Update model handler
  const handleUpdateModel = async () => {
    if (!editingModelId || !newModelName || !newDisplayName) {
      toast.error('Please fill in all fields')
      return
    }
    
    const success = await updateModel(editingModelId, newModelName, newDisplayName, newDescription)
    if (success) {
      setEditingModelId(null)
      setNewModelName('')
      setNewDisplayName('')
      setNewDescription('')
    }
  }
  
  // Start editing model
  const startEditModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      setEditingModelId(modelId)
      setNewModelName(model.model_name)
      setNewDisplayName(model.display_name)
      setNewDescription(model.description)
      setShowAddModel(false)
    }
  }
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingModelId(null)
    setShowAddModel(false)
    setNewModelName('')
    setNewDisplayName('')
    setNewDescription('')
  }
  
  // Delete model handler
  const handleDeleteModel = async (modelId: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      await deleteModel(modelId)
    }
  }
  
  // Set default model handler
  const handleSetDefaultModel = async (modelId: string) => {
    await setDefaultModel(modelId)
  }
  
  // Test specific model
  const handleTestModel = async (modelName: string) => {
    await testModel(modelName)
  }
  
  // Load agent configs
  const loadAgentConfigs = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.agents.configs)
      const data = await response.json()
      
      if (data.success) {
        setAgentConfigs(data.configs)
        toast.success('✅ Agent configs loaded')
      }
    } catch (error) {
      console.error('Failed to load agent configs:', error)
      toast.error('❌ Failed to load agent configs')
    }
  }
  
  // Toggle agent enable/disable
  const handleToggleAgent = async (agentId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.agents.toggle(agentId), {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`✅ Agent ${data.config.is_enabled === 1 ? 'enabled' : 'disabled'}`)
        loadAgentConfigs()
      } else {
        toast.error('❌ Failed to toggle agent')
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error)
      toast.error('❌ Failed to toggle agent')
    }
  }
  
  // Edit agent config
  const handleEditAgent = (agent: any) => {
    setEditingAgent(agent)
    // Check if RAG agent - use special modal
    if (agent.agent_type === 'rag') {
      setIsRAGModalOpen(true)
    } else {
      setIsEditModalOpen(true)
    }
  }
  
  // Save agent config updates
  const handleSaveAgent = async (agentId: string, updates: any) => {
    try {
      const response = await fetch(API_ENDPOINTS.agents.update(agentId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Agent configuration updated!')
        loadAgentConfigs()
        return true
      } else {
        toast.error('❌ Failed to update agent')
        return false
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
      toast.error('❌ Failed to update agent')
      return false
    }
  }
  
  // Load agent configs when AI Chat tab is active
  useEffect(() => {
    if (activeTab === 'ai-chat') {
      loadAgentConfigs()
    }
  }, [activeTab])
  
  // Load games when Games tab is active
  const loadGames = async () => {
    setLoadingGames(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.BACKEND_URL}/api/games/list`)
      const data = await response.json()
      if (data.success) {
        setGames(data.games)
      }
    } catch (error) {
      console.error('Failed to load games:', error)
    } finally {
      setLoadingGames(false)
    }
  }
  
  useEffect(() => {
    if (activeTab === 'games') {
      loadGames()
    }
  }, [activeTab])
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  // Tool Settings Modal state
  const [settingsToolId, setSettingsToolId] = useState<string | null>(null)
  const [settingsToolName, setSettingsToolName] = useState<string>('')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const {
    tools,
    loading,
    fetchTools,
    toggleTool,
    deleteTool,
  } = useToolsStore()

  const { mode, actualTheme, setMode } = useThemeStore()

  useEffect(() => {
    fetchTools()
  }, [])

  const categories = ['All Categories', 'Office', 'DevTools', 'Multimedia', 'Utilities', 'Security', 'Network', 'Data']
  const statuses = ['All Status', 'Active', 'Disabled']

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || tool.status === selectedStatus.toLowerCase()
    return matchesSearch && matchesCategory && matchesStatus
  })

  const statsData = {
    total: tools.length,
    active: tools.filter(t => t.status === 'active').length,
    disabled: tools.filter(t => t.status === 'disabled').length
  }

  const handleToggle = async (toolId: string) => {
    const toastId = toast.loading('Toggling tool status...')
    try {
      await toggleTool(toolId)
      toast.success('✅ Tool status updated!', { id: toastId })
    } catch (error) {
      toast.error('❌ Failed to toggle tool', { id: toastId })
    }
  }

  const handleDelete = async (toolId: string) => {
    if (confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      const toastId = toast.loading('Deleting tool...')
      try {
        await deleteTool(toolId)
        toast.success('✅ Tool deleted successfully!', { id: toastId })
      } catch (error) {
        toast.error('❌ Failed to delete tool', { id: toastId })
      }
    }
  }

  const handleEdit = () => {
    toast('Edit functionality coming in Phase 3!', { icon: 'ℹ️' })
  }

  const handleViewLogs = () => {
    toast('View logs functionality coming in Phase 3!', { icon: 'ℹ️' })
  }
  
  const handleSettings = (tool: any) => {
    setSettingsToolId(tool._id)
    setSettingsToolName(tool.name)
    setIsSettingsModalOpen(true)
  }
  
  const handleDependenciesInstalled = () => {
    // Refresh tools list after dependencies are installed
    fetchTools()
  }

  const tabs = [
    { id: 'tools' as TabType, label: 'Tools Management', icon: Wrench },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
    { id: 'ai-chat' as TabType, label: 'AI Chat', icon: MessageSquare },
    { id: 'personas' as TabType, label: 'Personas', icon: Users },
    { id: 'games' as TabType, label: 'Games', icon: Gamepad2 },
    { id: 'about' as TabType, label: 'About', icon: Info },
  ]

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col" data-testid="settings-page">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Settings</h1>
            <p className="text-secondary">Manage your ChimeraAI configuration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Tools Management Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-secondary mb-1">Total Tools</p>
                  <p className="text-3xl font-bold">{statsData.total}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-secondary mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-500">{statsData.active}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-secondary mb-1">Disabled</p>
                  <p className="text-3xl font-bold text-red-500">{statsData.disabled}</p>
                </div>
              </div>

              {/* Filters & Upload */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    data-testid="search-tools-input"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  data-testid="category-filter"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  data-testid="status-filter"
                >
                  {statuses.map(status => (
                    <option key={status} value={status === 'All Status' ? 'all' : status}>
                      {status}
                    </option>
                  ))}
                </select>

                {/* Upload Button */}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all whitespace-nowrap"
                  data-testid="open-upload-modal"
                >
                  <Plus className="w-4 h-4" />
                  Upload Tool
                </button>
                
                {/* Help Button */}
                <button
                  onClick={() => setIsHelpModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all whitespace-nowrap"
                  data-testid="open-help-modal"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help
                </button>
              </div>

              {/* Tools Table */}
              <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ToolsTable
                    tools={filteredTools}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onViewLogs={handleViewLogs}
                    onSettings={handleSettings}
                  />
                )}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Choose Your Theme</h2>
                    <p className="text-sm text-secondary">Select how ChimeraAI looks on your device</p>
                  </div>
                </div>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <ThemeCard
                    mode="light"
                    title="Light Mode"
                    description="Clean and bright interface for daytime use"
                    active={mode === 'light'}
                    onClick={() => {
                      setMode('light')
                      toast.success('☀️ Light theme activated!', { duration: 2000 })
                    }}
                  />
                  <ThemeCard
                    mode="dark"
                    title="Dark Mode"
                    description="Easy on the eyes with a sleek dark interface"
                    active={mode === 'dark'}
                    onClick={() => {
                      setMode('dark')
                      toast.success('🌙 Dark theme activated!', { duration: 2000 })
                    }}
                  />
                  <ThemeCard
                    mode="system"
                    title="System"
                    description="Automatically matches your system preferences"
                    active={mode === 'system'}
                    onClick={() => {
                      setMode('system')
                      toast.success('💻 System theme activated!', { duration: 2000 })
                    }}
                  />
                </div>

                {/* Current Theme Info */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-surface-hover border border-gray-200 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    {actualTheme === 'light' ? (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Current Theme</p>
                      <p className="text-xs text-secondary">
                        {mode === 'system' 
                          ? `System (${actualTheme === 'light' ? 'Light' : 'Dark'} detected)` 
                          : mode === 'light' ? 'Light' : 'Dark'}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Active
                  </div>
                </div>
              </div>

              {/* Additional Appearance Settings */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Advanced Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors">
                    <div>
                      <p className="font-medium">Glassmorphism Effects</p>
                      <p className="text-sm text-secondary">Frosted glass-like UI elements</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                      Enabled
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors">
                    <div>
                      <p className="font-medium">Smooth Animations</p>
                      <p className="text-sm text-secondary">Fluid transitions and effects</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                      Enabled
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors">
                    <div>
                      <p className="font-medium">High Contrast Mode</p>
                      <p className="text-sm text-secondary">Enhanced readability (Coming Soon)</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-500 text-xs font-medium">
                      Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai-chat' && (
            <div className="space-y-6">
              {/* Ollama Configuration */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Ollama Model Configuration</h2>
                    <p className="text-sm text-secondary">Configure local LLM settings</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Ollama URL */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Ollama Server URL</label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                      placeholder="http://localhost:11434"
                    />
                    <p className="text-xs text-secondary mt-1">Default Ollama server endpoint</p>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">AI Model</label>
                      <button
                        onClick={() => {
                          setShowAddModel(!showAddModel)
                          setEditingModelId(null)
                        }}
                        className="text-xs px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Model
                      </button>
                    </div>
                    
                    {/* Model List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedModelId === model.id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1" onClick={() => setSelectedModelId(model.id)}>
                              <div className="flex items-center gap-2">
                                {model.is_default === 1 && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                                <p className="font-medium cursor-pointer">{model.display_name}</p>
                              </div>
                              <p className="text-xs text-secondary mt-0.5">{model.model_name}</p>
                              {model.description && (
                                <p className="text-xs text-secondary mt-1">{model.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {model.is_default !== 1 && (
                                <button
                                  onClick={() => handleSetDefaultModel(model.id)}
                                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-surface-hover rounded"
                                  title="Set as default"
                                >
                                  <Star className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                              <button
                                onClick={() => handleTestModel(model.model_name)}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-surface-hover rounded"
                                title="Test model"
                              >
                                <TestTube className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => startEditModel(model.id)}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-surface-hover rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-gray-500" />
                              </button>
                              {model.is_default !== 1 && (
                                <button
                                  onClick={() => handleDeleteModel(model.id)}
                                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-surface-hover rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add/Edit Model Form */}
                    {(showAddModel || editingModelId) && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-surface-hover rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">
                          {editingModelId ? 'Edit Model' : 'Add New Model'}
                        </h4>
                        <input
                          type="text"
                          placeholder="Model Name (e.g., llama3:8b)"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Display Name (e.g., Core Agent 7B)"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={editingModelId ? handleUpdateModel : handleAddModel}
                            className="px-4 py-2 text-sm bg-primary hover:bg-secondary text-white rounded-lg transition-all"
                          >
                            {editingModelId ? 'Update' : 'Add'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-secondary mt-2">Choose the AI model for chat responses (managed in your database)</p>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTestConnection}
                      className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                    >
                      Test Connection
                    </button>
                    <button
                      onClick={handleSaveAIConfig}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* RAG Configuration */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">RAG & Context Management</h3>
                <div className="space-y-4">
                  {/* RAG Status */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-surface-hover">
                    <div>
                      <p className="font-medium">RAG System Status</p>
                      <p className="text-sm text-secondary">Retrieval-Augmented Generation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-500 font-medium">Ready</span>
                    </div>
                  </div>

                  {/* Context Size */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Context Window Size</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1000"
                        max="8000"
                        step="1000"
                        value={contextSize}
                        onChange={(e) => setContextSize(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-20 text-right">{contextSize} tokens</span>
                    </div>
                    <p className="text-xs text-secondary mt-1">Higher values use more memory but provide better context</p>
                  </div>

                  {/* Vector DB Path */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Vector Database Path</label>
                    <input
                      type="text"
                      value={config?.vector_db_path || 'data/vector_db'}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none"
                      disabled
                    />
                    <p className="text-xs text-secondary mt-1">Storage location for embeddings (relative to backend folder)</p>
                  </div>
                </div>
              </div>

              {/* Multi-Agent & Persona Control */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Multi-Agent & Persona Settings</h3>
                <div className="space-y-4">
                  {/* Tool Execution Agent */}
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors">
                    <div>
                      <p className="font-medium">Tool Execution Agent</p>
                      <p className="text-sm text-secondary">Allow AI to run Python tools automatically</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={executionEnabled}
                        onChange={(e) => setExecutionEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Execution Policy */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Execution Policy</label>
                    <select 
                      value={executionPolicy}
                      onChange={(e) => setExecutionPolicy(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="ask">Ask Before Running (Recommended)</option>
                      <option value="auto">Auto-execute (Trusted only)</option>
                      <option value="never">Never Execute</option>
                    </select>
                    <p className="text-xs text-secondary mt-1">How AI should handle tool execution requests</p>
                  </div>
                </div>
              </div>

              {/* Agent Configurations */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Specialized Agent Configurations</h3>
                    <p className="text-sm text-secondary">Each agent uses a different model for optimal performance</p>
                  </div>
                  <button
                    onClick={() => loadAgentConfigs()}
                    className="px-4 py-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {agentConfigs.map((agent) => {
                    // Agent type styling
                    const agentStyles: Record<string, { icon: string; color: string; bgColor: string; specialty: string }> = {
                      router: { 
                        icon: '🧭', 
                        color: 'text-blue-600 dark:text-blue-400', 
                        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                        specialty: 'Intent classification & routing'
                      },
                      rag: { 
                        icon: '📚', 
                        color: 'text-green-600 dark:text-green-400', 
                        bgColor: 'bg-green-100 dark:bg-green-900/30',
                        specialty: 'Context retrieval & embeddings'
                      },
                      chat: { 
                        icon: '💬', 
                        color: 'text-purple-600 dark:text-purple-400', 
                        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
                        specialty: 'Casual conversation & Q&A'
                      },
                      code: { 
                        icon: '💻', 
                        color: 'text-cyan-600 dark:text-cyan-400', 
                        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
                        specialty: 'Programming & debugging'
                      },
                      analysis: { 
                        icon: '📊', 
                        color: 'text-orange-600 dark:text-orange-400', 
                        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
                        specialty: 'Data analysis & reasoning'
                      },
                      creative: { 
                        icon: '🎨', 
                        color: 'text-pink-600 dark:text-pink-400', 
                        bgColor: 'bg-pink-100 dark:bg-pink-900/30',
                        specialty: 'Writing & creative tasks'
                      },
                      tool: { 
                        icon: '🔧', 
                        color: 'text-yellow-600 dark:text-yellow-400', 
                        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                        specialty: 'Tool detection & coordination'
                      },
                      execution: { 
                        icon: '⚡', 
                        color: 'text-red-600 dark:text-red-400', 
                        bgColor: 'bg-red-100 dark:bg-red-900/30',
                        specialty: 'Tool execution tasks'
                      },
                      reasoning: { 
                        icon: '🧠', 
                        color: 'text-indigo-600 dark:text-indigo-400', 
                        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
                        specialty: 'Complex reasoning & logic'
                      },
                      persona: { 
                        icon: '🎭', 
                        color: 'text-teal-600 dark:text-teal-400', 
                        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
                        specialty: 'Response formatting & style'
                      }
                    }
                    
                    const style = agentStyles[agent.agent_type] || { 
                      icon: '🤖', 
                      color: 'text-gray-600', 
                      bgColor: 'bg-gray-100',
                      specialty: 'General purpose'
                    }
                    
                    return (
                      <div
                        key={agent.id}
                        className="p-5 rounded-xl border border-gray-200 dark:border-dark-border hover:border-primary/50 transition-all bg-white dark:bg-dark-surface-hover group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-xl ${style.bgColor} flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            {style.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-lg">{agent.display_name}</h4>
                                <p className={`text-xs font-medium ${style.color}`}>
                                  {style.specialty}
                                </p>
                              </div>
                              
                              {/* Status Badge */}
                              {agent.is_enabled === 1 ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium">
                                  ✓ Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-600 dark:text-gray-400 font-medium">
                                  Disabled
                                </span>
                              )}
                            </div>
                            
                            {/* Description */}
                            <p className="text-sm text-secondary mb-3 line-clamp-2">
                              {agent.description}
                            </p>
                            
                            {/* Config Info */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                                <strong>Model:</strong> {agent.model_name}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                                <strong>Temp:</strong> {agent.temperature}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                                <strong>Tokens:</strong> {agent.max_tokens}
                              </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleAgent(agent.id)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  agent.is_enabled === 1
                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 dark:text-gray-400'
                                }`}
                                title={agent.is_enabled === 1 ? 'Disable agent' : 'Enable agent'}
                              >
                                <Power className="w-3 h-3 inline mr-1" />
                                {agent.is_enabled === 1 ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => handleEditAgent(agent)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary transition-all"
                                title="Edit agent configuration"
                              >
                                <Edit2 className="w-3 h-3 inline mr-1" />
                                Configure
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {agentConfigs.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
                      <InfoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-secondary">No agent configurations found</p>
                    <button
                      onClick={loadAgentConfigs}
                      className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Load Agent Configs
                    </button>
                  </div>
                )}
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Each agent uses a different model optimized for its task. Click "Configure" to change models.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      ⚡ <strong>Performance:</strong> Lighter models (phi3, gemma2) are faster. Larger models (llama3, qwen2.5) are more accurate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Status Overview */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Multi-Model Agent System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { name: 'Router', status: 'ready', color: 'blue' },
                    { name: 'RAG', status: 'ready', color: 'green' },
                    { name: 'Execution', status: 'ready', color: 'orange' },
                    { name: 'Reasoning', status: 'ready', color: 'purple' },
                    { name: 'Persona', status: 'ready', color: 'pink' }
                  ].map((agent) => (
                    <div key={agent.name} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-dark-surface-hover">
                      <div className={`w-3 h-3 rounded-full bg-${agent.color}-500 mx-auto mb-2`} />
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-secondary capitalize">{agent.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Personas Tab */}
          {activeTab === 'personas' && (
            <PersonaManager />
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Games Management</h2>
                      <p className="text-sm text-secondary">Upload and manage WebGL games</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUploadGameModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Game
                  </button>
                </div>

                {/* Games List */}
                {loadingGames ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : games.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-secondary mb-4">No games uploaded yet</p>
                    <button
                      onClick={() => setIsUploadGameModalOpen(true)}
                      className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Upload Your First Game
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-dark-surface-hover border border-gray-200 dark:border-dark-border hover:border-primary/50 transition-all"
                      >
                        {/* Game Cover */}
                        <img
                          src={game.cover_image_url}
                          alt={game.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/64x64/667eea/ffffff?text=${game.name.charAt(0)}`
                          }}
                        />
                        
                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{game.name}</h4>
                          <p className="text-sm text-secondary truncate">{game.description}</p>
                          <div className="flex gap-3 mt-1 text-xs text-secondary">
                            <span>{(game.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{new Date(game.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Navigate to Games page
                              window.location.href = '/#/games'
                            }}
                            className="px-4 py-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all"
                          >
                            View All Games
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Games must be packaged as ZIP files with an index.html entry point. All assets should use relative paths.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    🎮 <strong>Play:</strong> Launch games from the Games page. The launcher will minimize automatically when you start playing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* System Health Monitor */}
              <div className="glass rounded-xl p-6">
                <SystemHealthMonitor />
              </div>

              {/* About Info */}
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">About ChimeraAI</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-secondary mb-1">Version</p>
                    <p className="font-medium">1.0.0 - Phase 2</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary mb-1">Electron Info</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">Status:</span>
                        <span className="text-green-500 font-medium">Running</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">IPC:</span>
                        <span className="text-green-500 font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-secondary mb-1">Description</p>
                    <p className="text-sm">Your intelligent desktop companion for automation, creativity, and productivity.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadToolModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchTools()}
      />
      
      {/* Upload Game Modal */}
      <UploadGameModal
        isOpen={isUploadGameModalOpen}
        onClose={() => setIsUploadGameModalOpen(false)}
        onSuccess={() => loadGames()}
      />
      
      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      
      {/* Edit Agent Modal */}
      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingAgent(null)
        }}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />
      
      {/* Edit RAG Agent Modal */}
      <EditRAGAgentModal
        isOpen={isRAGModalOpen}
        onClose={() => {
          setIsRAGModalOpen(false)
          setEditingAgent(null)
        }}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />
      
      {/* Tool Settings Modal */}
      {settingsToolId && (
        <ToolSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false)
            setSettingsToolId(null)
            setSettingsToolName('')
          }}
          toolId={settingsToolId}
          toolName={settingsToolName}
          onDependenciesInstalled={handleDependenciesInstalled}
        />
      )}
    </div>
  )
}