import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Info, RefreshCw, AlertTriangle, Maximize2, Minimize2, X } from 'lucide-react'
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
  const [iframeContent, setIframeContent] = useState<string>('')
  const [showInfo, setShowInfo] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!toolId) {
      navigate('/tools')
      return
    }
    
    // Find tool from store
    const foundTool = tools.find(t => t._id === toolId)
    if (foundTool) {
      setTool(foundTool)
      loadToolContent(foundTool)
    } else {
      // Fetch tools if not loaded
      fetchTools().then(() => {
        const foundTool = tools.find(t => t._id === toolId)
        if (foundTool) {
          setTool(foundTool)
          loadToolContent(foundTool)
        } else {
          setError('Tool not found')
          setLoading(false)
        }
      })
    }
  }, [toolId, tools, fetchTools, navigate])

  const loadToolContent = async (toolData: any) => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = 'http://localhost:8001'
      
      // Fetch FRONTEND file from backend API
      const response = await fetch(`${backendUrl}/api/tools/file/${toolData._id}?file_type=frontend`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const toolContent = data.content
      const filename = data.filename
      const fileExt = filename.split('.').pop()?.toLowerCase()

      // Create iframe content based on file type
      let htmlContent = ''

      if (fileExt === 'html') {
        // Inject window.TOOL_ID and BACKEND_URL with responsive meta tags
        const toolIdInjection = `
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta charset="UTF-8">
  <script>
    window.TOOL_ID = "${toolData._id}";
    window.BACKEND_URL = "${backendUrl}";
  </script>
  <style>
    body { margin: 0; padding: 0; overflow-x: hidden; }
    * { box-sizing: border-box; }
  </style>
</head>
`
        if (toolContent.includes('<head>')) {
          htmlContent = toolContent.replace('<head>', toolIdInjection)
        } else if (toolContent.includes('<html>')) {
          htmlContent = toolContent.replace('<html>', '<html>' + toolIdInjection)
        } else {
          htmlContent = '<html>' + toolIdInjection + '<body>' + toolContent + '</body></html>'
        }
      } else {
        // For other types, create wrapper (future support)
        htmlContent = `<html><body><h3>Unsupported file type: ${fileExt}</h3></body></html>`
      }

      setIframeContent(htmlContent)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load tool:', err)
      setError(err.message || 'Failed to load tool')
      setLoading(false)
      toast.error('Failed to load tool: ' + (err.message || 'Unknown error'))
    }
  }

  const handleRefresh = () => {
    if (tool) {
      loadToolContent(tool)
    }
  }

  const handleBack = () => {
    navigate('/tools')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-dark-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
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
            className="flex-shrink-0 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm"
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

      {/* Info Panel - Sliding from bottom on mobile */}
      <AnimatePresence>
        {showInfo && !isMaximized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm lg:text-base text-blue-900 dark:text-blue-100">About This Tool</h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="md:hidden p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs lg:text-sm text-blue-800 dark:text-blue-200 mb-3">{tool.description}</p>
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

      {/* Tool Content - Fullscreen or Normal */}
      <div className={`flex-1 overflow-hidden relative ${
        isMaximized ? 'fixed inset-0 z-50 bg-white dark:bg-dark-background' : ''
      }`}>
        {/* Fullscreen Exit Button - Floating */}
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
        
        {/* Iframe - Responsive & Smooth */}
        <motion.iframe
          key={tool._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          srcDoc={iframeContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title={`${tool.name} - Tool Interface`}
          data-testid="tool-iframe"
        />
      </div>
    </div>
  )
}
