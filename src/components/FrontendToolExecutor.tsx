import { useState, useEffect } from 'react'
import { X, Maximize2, Minimize2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Tool } from '@/store/toolsStore'

interface FrontendToolExecutorProps {
  tool: Tool
  isOpen: boolean
  onClose: () => void
}

export default function FrontendToolExecutor({ tool, isOpen, onClose }: FrontendToolExecutorProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeContent, setIframeContent] = useState<string>('')

  useEffect(() => {
    if (isOpen && tool) {
      loadTool()
    }
  }, [isOpen, tool])

  const loadTool = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get backend URL
      const backendUrl = 'http://localhost:8001'
      
      // Fetch FRONTEND file from backend API (for dual tools)
      const response = await fetch(`${backendUrl}/api/tools/file/${tool._id}?file_type=frontend`, {
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
        // For HTML files, inject window.TOOL_ID before the content
        const toolIdInjection = `
<script>
  // Inject TOOL_ID for backend communication
  window.TOOL_ID = "${tool._id}";
  window.BACKEND_URL = "${backendUrl}";
</script>
`
        // Insert injection right after <head> tag or at the beginning
        if (toolContent.includes('<head>')) {
          htmlContent = toolContent.replace('<head>', '<head>' + toolIdInjection)
        } else if (toolContent.includes('<html>')) {
          htmlContent = toolContent.replace('<html>', '<html>' + toolIdInjection)
        } else {
          htmlContent = toolIdInjection + toolContent
        }
      } else if (fileExt === 'jsx' || fileExt === 'tsx' || fileExt === 'js') {
        // For React/JS files, create a minimal HTML wrapper
        htmlContent = createReactWrapper(toolContent, tool.name)
      }

      // Set content to be loaded via srcdoc
      setIframeContent(htmlContent)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load tool:', err)
      setError(err.message || 'Failed to load tool')
      setLoading(false)
    }
  }

  const createReactWrapper = (componentCode: string, toolName: string) => {
    // Create a simple HTML wrapper with React CDN for standalone execution
    // Using relaxed CSP for iframe content only
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline';">
  <title>${toolName}</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    #root {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${componentCode}
    
    // Try to render the component
    const rootElement = document.getElementById('root');
    
    // Find the exported component (could be default or named export)
    let ComponentToRender = null;
    
    // Check for default export
    if (typeof Component !== 'undefined') {
      ComponentToRender = Component;
    } else if (typeof App !== 'undefined') {
      ComponentToRender = App;
    } else if (typeof ToolComponent !== 'undefined') {
      ComponentToRender = ToolComponent;
    } else {
      // Try to find any exported function that looks like a React component
      const matches = componentCode.match(/(?:export\\s+default\\s+function\\s+)(\\w+)|(?:const\\s+)(\\w+)(?:\\s*=\\s*\\()/g);
      if (matches && matches.length > 0) {
        const componentName = matches[0].replace(/export\\s+default\\s+function\\s+|const\\s+|\\s*=\\s*\\(/g, '').trim();
        ComponentToRender = eval(componentName);
      }
    }
    
    if (ComponentToRender && rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(ComponentToRender));
    } else {
      rootElement.innerHTML = '<div style="padding: 20px; color: #666;"><h3>⚠️ Component Error</h3><p>Could not find a valid React component to render. Make sure your component is exported.</p></div>';
    }
  </script>
</body>
</html>
    `
  }

  const handleRefresh = () => {
    loadTool()
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className={`glass-strong rounded-2xl flex flex-col transition-all duration-300 ${
          isMaximized 
            ? 'w-[95vw] h-[95vh]' 
            : 'w-[90vw] h-[85vh] max-w-6xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-lg">⚛️</span>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">{tool.name}</h2>
              <p className="text-xs text-secondary">Frontend Tool Executor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
              title="Refresh tool"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-background">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-secondary">Loading tool...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-background p-8">
              <div className="text-center max-w-md">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Failed to Load Tool</h3>
                <p className="text-secondary mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <iframe
              srcDoc={iframeContent}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title={`${tool.name} - Frontend Tool`}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-dark-border text-xs text-muted flex-shrink-0">
          <span>Frontend Tool • {tool.version}</span>
          <span>By {tool.author}</span>
        </div>
      </div>
    </div>
  )
}
