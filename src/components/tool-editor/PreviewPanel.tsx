import { useEffect, useState, useRef } from 'react'
import { AlertCircle, Loader2, RefreshCw, Maximize2, Minimize2 } from 'lucide-react'

interface PreviewPanelProps {
  toolId: string
  mode: 'static' | 'full'
  rebuilding?: boolean  // Add rebuilding prop
  refreshKey?: number   // Add refresh key for cache busting
}

export default function PreviewPanel({ toolId, mode, rebuilding = false, refreshKey = 0 }: PreviewPanelProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Cache busting: Add timestamp to URL to force reload
  const timestamp = Date.now()
  const cacheParam = refreshKey > 0 ? `&t=${timestamp}` : `?t=${timestamp}`
  
  // Use backend render endpoint instead of frontend route
  const toolUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'}/api/tools/${toolId}/render${mode === 'static' ? '?preview=static' : ''}${cacheParam}`
  
  useEffect(() => {
    setLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [toolId, mode, refreshKey])  // Add refreshKey to dependencies
  
  // Show loading when rebuilding
  const isLoading = loading || rebuilding
  
  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
    >
      {/* Preview Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface-hover">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            mode === 'static' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <span className="text-xs font-medium">
            {mode === 'static' ? 'Static Preview' : 'Full Preview'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-surface z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-secondary">
                {rebuilding ? '🔨 Rebuilding tool...' : 'Loading preview...'}
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-surface z-10">
            <div className="text-center p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={toolUrl}
          className="w-full h-full border-0"
          title="Tool Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError('Failed to load preview')
          }}
        />
      </div>
      
      {/* Info Bar */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface-hover">
        <p className="text-xs text-secondary">
          {mode === 'static' 
            ? '🔵 UI preview only - API calls disabled'
            : '🟢 Full preview - All features enabled'}
        </p>
      </div>
    </div>
  )
}
