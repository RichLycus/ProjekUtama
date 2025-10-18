import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Grid3x3, List, Settings } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import ToolsSidePanel from '@/components/ToolsSidePanel'
import ToolCard from '@/components/ToolCard'
import ToolListItem from '@/components/ToolListItem'
import FrontendToolExecutor from '@/components/FrontendToolExecutor'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ToolsPage() {
  const navigate = useNavigate()
  const [executingFrontendTool, setExecutingFrontendTool] = useState<any>(null)
  const {
    tools,
    loading,
    error,
    viewMode,
    setViewMode,
    fetchTools,
    executeToolHandling,
    getFilteredTools,
  } = useToolsStore()

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const filteredTools = getFilteredTools()

  const handleExecute = async (tool: any) => {
    // Check if it's a frontend tool
    if (tool.tool_type === 'frontend') {
      setExecutingFrontendTool(tool)
      return
    }

    // Backend tool execution
    const toastId = toast.loading('Executing tool...')
    try {
      const result = await executeToolHandling(tool._id)
      if (result.success) {
        toast.success('✅ Tool executed successfully!', { id: toastId })
      } else {
        toast.error('⚠️ Execution failed: ' + result.error, { id: toastId })
      }
    } catch (error: any) {
      toast.error('❌ Execution error: ' + error.message, { id: toastId })
    }
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)]">
      {/* Side Panel */}
      <ToolsSidePanel />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Python Tools
              </h1>
              <p className="text-secondary text-lg">
                Click on any tool card to run powerful automation scripts
              </p>
            </div>
            
            {/* View Toggle & Upload */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
                  }`}
                  title="Grid view"
                  data-testid="view-grid"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
                  }`}
                  title="List view"
                  data-testid="view-list"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Manage Tools Button */}
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                data-testid="manage-tools-button"
                title="Go to Settings to manage tools"
              >
                <Settings className="w-4 h-4" />
                Manage Tools
              </button>
            </div>
          </div>

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

          {/* Grid View */}
          {!loading && viewMode === 'grid' && filteredTools.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

      {/* Frontend Tool Executor Modal */}
      {executingFrontendTool && (
        <FrontendToolExecutor
          tool={executingFrontendTool}
          isOpen={!!executingFrontendTool}
          onClose={() => setExecutingFrontendTool(null)}
        />
      )}
    </div>
  )
}