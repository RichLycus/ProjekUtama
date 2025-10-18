import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Wrench, Palette, Info, Plus, Search, Sun, Moon, HelpCircle } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import { useThemeStore } from '@/store/themeStore'
import ToolsTable from '@/components/ToolsTable'
import UploadToolModal from '@/components/UploadToolModal'
import HelpModal from '@/components/HelpModal'
import ThemeCard from '@/components/ThemeCard'
import toast from 'react-hot-toast'

type TabType = 'tools' | 'appearance' | 'about'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tools')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

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

  const tabs = [
    { id: 'tools' as TabType, label: 'Tools Management', icon: Wrench },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
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

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
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
      
      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  )
}