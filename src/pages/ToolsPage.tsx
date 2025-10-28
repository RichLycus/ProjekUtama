import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Grid3x3, List, Settings, BookOpen, Search, Plus, Wrench, FileText, Code2, Film, Shield, Wifi, Database } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import { cn } from '@/lib/utils'
import ToolCard from '@/components/ToolCard'
import ToolListItem from '@/components/ToolListItem'
import LoadingSpinner from '@/components/LoadingSpinner'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Wrench },
  { id: 'DevTools', label: 'DevTools', icon: Code2 },
  { id: 'Multimedia', label: 'Media', icon: Film },
  { id: 'Utilities', label: 'Utilities', icon: Wrench },
  { id: 'Office', label: 'Office', icon: FileText },
  { id: 'Security', label: 'Security', icon: Shield },
  { id: 'Network', label: 'Network', icon: Wifi },
  { id: 'Data', label: 'Data', icon: Database },
]

export default function ToolsPage() {
  const navigate = useNavigate()
  const {
    tools,
    loading,
    error,
    viewMode,
    searchQuery,
    selectedCategory,
    setViewMode,
    setSearchQuery,
    setSelectedCategory,
    fetchTools,
    getFilteredTools,
  } = useToolsStore()

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const filteredTools = getFilteredTools()

  const handleExecute = async (tool: any) => {
    // Navigate to dedicated tool execution page
    navigate(`/tools/${tool._id}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]">
      {/* Top Header with Search & Actions */}
      <div className="glass-strong border-b border-gray-200 dark:border-dark-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title & Search */}
            <div className="flex items-center gap-4 flex-1">
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Tools 🧰
                </h1>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full pl-10 pr-4 py-2 glass rounded-lg text-sm border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  data-testid="tools-search-input"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
                  )}
                  title="Grid view"
                  data-testid="view-grid"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
                  )}
                  title="List view"
                  data-testid="view-list"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Guide Button */}
              <button
                onClick={() => navigate('/tools-guide')}
                className="flex items-center gap-2 px-4 py-2 glass hover:glass-strong text-primary dark:text-white rounded-lg font-medium transition-all"
                data-testid="tools-guide-button"
                title="Learn how to create tools"
              >
                <BookOpen className="w-4 h-4" />
                Guide
              </button>

              {/* Add Tool Button */}
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                data-testid="add-tool-button"
                title="Add new tool"
              >
                <Plus className="w-4 h-4" />
                Add Tool
              </button>
            </div>
          </div>
        </div>

        {/* Top Tabs for Categories */}
        <div className="px-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-horizontal">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              const isActive = selectedCategory === category.id
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 whitespace-nowrap border-b-2',
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-secondary border-transparent hover:text-primary hover:border-gray-300'
                  )}
                  data-testid={`category-tab-${category.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 glass-strong border-l-4 border-red-500 rounded-lg">
              <p className="text-red-500 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 glass-strong rounded-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Tools Found</h3>
              <p className="text-secondary mb-8 max-w-md text-center">
                {tools.length === 0
                  ? 'Upload your first Python tool to get started with automation'
                  : 'Try adjusting your filters to find tools'}
              </p>
              <button 
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Settings className="w-5 h-5" />
                Go to Settings
              </button>
            </div>
          )}

          {/* Grid View - Responsive */}
          {!loading && viewMode === 'grid' && filteredTools.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool._id}
                  tool={tool}
                  onExecute={() => handleExecute(tool)}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {!loading && viewMode === 'list' && filteredTools.length > 0 && (
            <div className="space-y-3">
              {filteredTools.map((tool) => (
                <ToolListItem
                  key={tool._id}
                  tool={tool}
                  onExecute={() => handleExecute(tool)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}