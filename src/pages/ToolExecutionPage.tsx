/**
 * Tool Execution Page (iframe-based rendering with smart cache busting)
 * 
 * This page loads and renders tool components via iframe from built bundles.
 * Uses the same smart loading mechanism as Tool Editor Preview.
 * 
 * Benefits:
 * - Proper cache busting (no stale previews)
 * - Self-contained bundles with React included
 * - Isolated execution environment
 * - Easy refresh and reload
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Info, RefreshCw, AlertTriangle, 
  Maximize2, Minimize2, X, Loader2 
} from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function ToolExecutionPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  const { tools, fetchTools } = useToolsStore()
  
  const [tool, setTool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!toolId) {
      navigate('/tools')
      return
    }
    
    // Find tool from store
    const foundTool = tools.find(t => t._id === toolId)
    if (foundTool) {
      setTool(foundTool)
      setLoading(false)
    } else {
      // Fetch tools if not loaded
      fetchTools().then(() => {
        const foundTool = tools.find(t => t._id === toolId)
        if (foundTool) {
          setTool(foundTool)
          setLoading(false)
        } else {
          setError('Tool not found')
          setLoading(false)
        }
      })
    }
  }, [toolId, tools, fetchTools, navigate])

  const handleRefresh = () => {
    // Force reload iframe with new cache busting key
    setRefreshKey(prev => prev + 1)
    toast.success('Refreshing tool...')
  }

  const handleBack = () => {
    navigate('/tools')
  }
  
  // Generate iframe URL with cache busting
  const timestamp = Date.now()
  const cacheParam = refreshKey > 0 ? `?t=${timestamp}-${refreshKey}` : `?t=${timestamp}`
  const toolUrl = tool 
    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'}/api/tools/${toolId}/render${cacheParam}`
    : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-dark-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-secondary text-lg">Loading tool...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="flex items-center justify-center h-screen p-4 sm:p-8 bg-white dark:bg-dark-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertTriangle className="w-16 sm:w-20 h-16 sm:h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Failed to Load Tool</h2>
          <p className="text-secondary mb-6 text-sm sm:text-base">{error || 'Tool not found'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg transition-colors"
          >
            Back to Tools
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-dark-background">
      {/* Header - Hidden in fullscreen mode */}
      <AnimatePresence>
        {!isMaximized && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm z-10"
          >
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
              {/* Left: Back button + Title */}
              <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-all group flex-shrink-0"
                  data-testid="tool-back-button"
                >
                  <ArrowLeft className="w-4 lg:w-5 h-4 lg:h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium text-sm lg:text-base">Back</span>
                </button>
                
                <div className="h-6 lg:h-8 w-px bg-gray-300 dark:bg-dark-border flex-shrink-0" />
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg lg:text-2xl font-display font-bold truncate" data-testid="tool-title">
                    {tool.name}
                  </h1>
                  <p className="text-xs lg:text-sm text-secondary truncate">v{tool.version} • {tool.author}</p>
                </div>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                  title="Refresh tool"
                  data-testid="tool-refresh-button"
                >
                  <RefreshCw className={`w-4 lg:w-5 h-4 lg:h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                  title="Fullscreen"
                  data-testid="tool-maximize-button"
                >
                  <Maximize2 className="w-4 lg:w-5 h-4 lg:h-5" />
                </button>
                
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2 rounded-lg transition-colors ${
                    showInfo 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                  }`}
                  title="Tool information"
                  data-testid="tool-info-button"
                >
                  <Info className="w-4 lg:w-5 h-4 lg:h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden">
              {/* Top Row: Back + Actions */}
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-all"
                  data-testid="tool-back-button-mobile"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => setIsMaximized(true)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showInfo 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                    }`}
                    title="Info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Title */}
              <div className="px-3 pb-2">
                <h1 className="text-base font-display font-bold truncate" data-testid="tool-title-mobile">
                  {tool.name}
                </h1>
                <p className="text-xs text-secondary truncate">v{tool.version} • {tool.author}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && !isMaximized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 overflow-hidden z-10"
          >
            <div className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm lg:text-base text-blue-900 dark:text-blue-100">
                    About This Tool
                  </h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="md:hidden p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs lg:text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {tool.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs lg:text-sm">
                  <div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Category:</span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">{tool.category}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Status:</span>{' '}
                    <span className={`font-medium ${
                      tool.status === 'active' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tool.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Type:</span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">{tool.tool_type || 'backend'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Content - iframe with smart cache busting */}
      <div className={`flex-1 overflow-hidden relative ${
        isMaximized ? 'fixed inset-0 z-50 bg-white dark:bg-dark-background' : ''
      }`}>
        {/* Fullscreen Exit Button */}
        <AnimatePresence>
          {isMaximized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50"
            >
              <button
                onClick={() => setIsMaximized(false)}
                className="group p-2.5 sm:p-3 glass-ultra rounded-xl shadow-2xl hover:shadow-primary/50 transition-all hover:scale-110 border border-gray-200 dark:border-dark-border"
                title="Exit fullscreen"
                data-testid="tool-minimize-button"
              >
                <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white group-hover:text-primary transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Render Tool via iframe (self-contained bundle) */}
        <motion.div
          key={`${tool._id}-${refreshKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
          data-testid="tool-component-container"
        >
          <iframe
            ref={iframeRef}
            src={toolUrl}
            className="w-full h-full border-0"
            title={`${tool.name} - Tool`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            onLoad={() => {
              console.log('✅ Tool iframe loaded successfully')
            }}
            onError={(e) => {
              console.error('❌ Tool iframe load error:', e)
              setError('Failed to load tool preview')
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}