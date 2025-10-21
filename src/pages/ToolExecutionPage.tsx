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
      } else if (fileExt === 'jsx' || fileExt === 'tsx' || fileExt === 'js') {
        // For JSX/TSX/JS files, create React wrapper with proper module handling
        // Transform import statements to work with CDN modules
        let transformedContent = toolContent
          // Remove import statements and store them
          .replace(/import\s+React[^;]+;?/g, '// React imported from CDN')
          .replace(/import\s+\{[^}]+\}\s+from\s+['"]react['"];?/g, '// React hooks imported from CDN')
          .replace(/import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"];?/g, '// Lucide icons imported from CDN')
          // Remove any other imports
          .replace(/import\s+[^;]+;/g, '')
          // Remove export statements
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+/g, '')
        
        htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${toolData.name}</title>
  
  <!-- React & ReactDOM from CDN (Development versions for better error messages) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Babel Standalone for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Axios for HTTP requests -->
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  
  <script>
    // Inject tool context
    window.TOOL_ID = "${toolData._id}";
    window.BACKEND_URL = "${backendUrl}";
    
    // Setup Tailwind config
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {}
      }
    }
  </script>
  
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    }
    * { box-sizing: border-box; }
    #root { width: 100%; min-height: 100vh; }
    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading-indicator">Loading dependencies...</div>
  </div>
  
  <script type="text/babel" data-type="module">
    (async function() {
      try {
        // Wait for dependencies to load
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();
        
        while (!window.React || !window.ReactDOM) {
          if (Date.now() - startTime > maxWait) {
            throw new Error('Failed to load React dependencies');
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Extract React globals
        const React = window.React;
        const { useState, useEffect, useCallback, useRef, useMemo, useReducer, createContext, useContext } = React;
        const ReactDOM = window.ReactDOM;
        
        // Create Lucide icon components as React functional components
        const createLucideIcon = (name, path) => {
          return (props) => {
            const { size = 24, color = 'currentColor', strokeWidth = 2, className = '', ...rest } = props || {};
            return React.createElement('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              width: size,
              height: size,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: color,
              strokeWidth: strokeWidth,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: className,
              ...rest
            }, path);
          };
        };
        
        // Define commonly used Lucide icons with their SVG paths
        const Upload = createLucideIcon('Upload', [
          React.createElement('path', { key: 1, d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
          React.createElement('polyline', { key: 2, points: '17 8 12 3 7 8' }),
          React.createElement('line', { key: 3, x1: '12', y1: '3', x2: '12', y2: '15' })
        ]);
        
        const Download = createLucideIcon('Download', [
          React.createElement('path', { key: 1, d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
          React.createElement('polyline', { key: 2, points: '7 10 12 15 17 10' }),
          React.createElement('line', { key: 3, x1: '12', y1: '15', x2: '12', y2: '3' })
        ]);
        
        const Eye = createLucideIcon('Eye', [
          React.createElement('path', { key: 1, d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
          React.createElement('circle', { key: 2, cx: '12', cy: '12', r: '3' })
        ]);
        
        const EyeOff = createLucideIcon('EyeOff', [
          React.createElement('path', { key: 1, d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }),
          React.createElement('line', { key: 2, x1: '1', y1: '1', x2: '23', y2: '23' })
        ]);
        
        const Trash2 = createLucideIcon('Trash2', [
          React.createElement('polyline', { key: 1, points: '3 6 5 6 21 6' }),
          React.createElement('path', { key: 2, d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
          React.createElement('line', { key: 3, x1: '10', y1: '11', x2: '10', y2: '17' }),
          React.createElement('line', { key: 4, x1: '14', y1: '11', x2: '14', y2: '17' })
        ]);
        
        const Sparkles = createLucideIcon('Sparkles', [
          React.createElement('path', { key: 1, d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' }),
          React.createElement('path', { key: 2, d: 'M5 3v4' }),
          React.createElement('path', { key: 3, d: 'M19 17v4' }),
          React.createElement('path', { key: 4, d: 'M3 5h4' }),
          React.createElement('path', { key: 5, d: 'M17 19h4' })
        ]);
        
        const Check = createLucideIcon('Check', [
          React.createElement('polyline', { key: 1, points: '20 6 9 17 4 12' })
        ]);
        
        const Info = createLucideIcon('Info', [
          React.createElement('circle', { key: 1, cx: '12', cy: '12', r: '10' }),
          React.createElement('line', { key: 2, x1: '12', y1: '16', x2: '12', y2: '12' }),
          React.createElement('line', { key: 3, x1: '12', y1: '8', x2: '12.01', y2: '8' })
        ]);
        
        const X = createLucideIcon('X', [
          React.createElement('line', { key: 1, x1: '18', y1: '6', x2: '6', y2: '18' }),
          React.createElement('line', { key: 2, x1: '6', y1: '6', x2: '18', y2: '18' })
        ]);
        
        const ImageIcon = createLucideIcon('Image', [
          React.createElement('rect', { key: 1, x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
          React.createElement('circle', { key: 2, cx: '8.5', cy: '8.5', r: '1.5' }),
          React.createElement('polyline', { key: 3, points: '21 15 16 10 5 21' })
        ]);
        
        const Copy = createLucideIcon('Copy', [
          React.createElement('rect', { key: 1, x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' }),
          React.createElement('path', { key: 2, d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' })
        ]);
        
        const RotateCcw = createLucideIcon('RotateCcw', [
          React.createElement('polyline', { key: 1, points: '1 4 1 10 7 10' }),
          React.createElement('path', { key: 2, d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' })
        ]);
        
        const AlertCircle = createLucideIcon('AlertCircle', [
          React.createElement('circle', { key: 1, cx: '12', cy: '12', r: '10' }),
          React.createElement('line', { key: 2, x1: '12', y1: '8', x2: '12', y2: '12' }),
          React.createElement('line', { key: 3, x1: '12', y1: '16', x2: '12.01', y2: '16' })
        ]);
        
        // Tool component code
        ${transformedContent}
        
        // Render the component
        const rootElement = document.getElementById('root');
        const root = ReactDOM.createRoot(rootElement);
        
        // Find the component (look for common export patterns)
        let Component = null;
        
        // Try to find the component by common names
        if (typeof BackgroundRemover !== 'undefined') Component = BackgroundRemover;
        else if (typeof App !== 'undefined') Component = App;
        else if (typeof Tool !== 'undefined') Component = Tool;
        else if (typeof default_1 !== 'undefined') Component = default_1;
        
        if (Component) {
          root.render(React.createElement(Component));
        } else {
          root.render(
            React.createElement('div', { style: { padding: '20px', color: 'red', fontFamily: 'monospace' } }, [
              React.createElement('h3', { key: 'h3' }, 'Error: Component not found'),
              React.createElement('p', { key: 'p1' }, 'Please ensure your component is exported. Supported names: BackgroundRemover, App, Tool'),
              React.createElement('p', { key: 'p2' }, 'Example: const BackgroundRemover = () => ...')
            ])
          );
        }
      } catch (error) {
        console.error('Failed to initialize tool:', error);
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = 
            '<div style="padding: 20px; color: red; font-family: monospace;">' +
            '<h3>Initialization Error:</h3>' +
            '<p>' + error.message + '</p>' +
            '<details style="margin-top: 10px;"><summary>Stack Trace</summary><pre>' + (error?.stack || 'No stack trace available') + '</pre></details>' +
            '</div>';
        }
      }
    })();
  </script>
  
  <script>
    // Global error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Tool Error:', msg, error);
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = 
          '<div style="padding: 20px; color: red; font-family: monospace;">' +
          '<h3>Runtime Error:</h3>' +
          '<p>' + msg + '</p>' +
          '<p>Line: ' + lineNo + ', Column: ' + columnNo + '</p>' +
          '<details style="margin-top: 10px;"><summary>Stack Trace</summary><pre>' + (error?.stack || 'No stack trace available') + '</pre></details>' +
          '</div>';
      }
      return false;
    };
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled promise rejection:', event.reason);
      const rootEl = document.getElementById('root');
      if (rootEl && !rootEl.innerHTML) {
        rootEl.innerHTML = 
          '<div style="padding: 20px; color: red; font-family: monospace;">' +
          '<h3>Promise Rejection:</h3>' +
          '<p>' + event.reason + '</p>' +
          '</div>';
      }
    });
  </script>
</body>
</html>
`
      } else {
        // For other types, show unsupported message
        htmlContent = `<html><body><h3>Unsupported file type: ${fileExt}</h3><p>Supported: .html, .jsx, .tsx, .js</p></body></html>`
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
