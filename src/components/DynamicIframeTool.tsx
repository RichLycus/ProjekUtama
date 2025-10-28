/**
 * Dynamic Iframe Tool Loader
 * 
 * Loads uploaded tools via iframe with shared dependency context.
 * Supports postMessage communication for tool execution and events.
 * 
 * Features:
 * - Shared dependencies (React, lucide-react, Tailwind)
 * - PostMessage communication
 * - Auto-resize iframe to content
 * - Error handling & loading states
 */

import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export interface DynamicIframeToolProps {
  toolId: string
  toolData: any
  backendUrl?: string
}

export const DynamicIframeTool: React.FC<DynamicIframeToolProps> = ({
  toolId,
  toolData,
  backendUrl = 'http://localhost:8001'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState('100vh')

  useEffect(() => {
    // Listen for messages from iframe tool
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin if needed
      if (event.data.source !== 'tool') return

      const { type, payload } = event.data

      switch (type) {
        case 'tool:ready':
          console.log('✅ Tool loaded successfully:', toolData.name)
          setLoading(false)
          setError(null)
          break

        case 'tool:error':
          console.error('❌ Tool error:', payload)
          setError(payload.message || 'Tool encountered an error')
          toast.error(payload.message || 'Tool error')
          break

        case 'tool:resize':
          // Auto-resize iframe to content height
          if (payload.height) {
            setIframeHeight(`${payload.height}px`)
          }
          break

        case 'tool:result':
          console.log('📤 Tool result:', payload)
          // Handle tool execution result
          toast.success('Tool executed successfully')
          break

        case 'tool:log':
          console.log('[Tool Log]:', payload)
          break

        default:
          console.warn('Unknown message type:', type)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [toolData.name])

  const handleIframeLoad = () => {
    console.log('📦 Iframe loaded for tool:', toolData.name)
    
    // Send initialization data to tool
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'init',
          payload: {
            toolId,
            toolData,
            backendUrl
          }
        },
        '*'
      )
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src // Force reload
    }
  }

  // Check if tool has built bundle
  const slug = toolData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const iframeUrl = `${backendUrl}/api/tools/${toolId}/render`

  return (
    <div className="relative w-full h-full">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-background z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-secondary text-lg">Loading {toolData.name}...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-background z-10 p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to Load Tool</h3>
            <p className="text-secondary mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Iframe Tool Container */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title={toolData.name}
        className="w-full border-0"
        style={{ 
          height: iframeHeight,
          minHeight: '100vh'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        onLoad={handleIframeLoad}
        onError={() => {
          setError('Failed to load tool. The tool may not be built yet.')
          setLoading(false)
        }}
      />
    </div>
  )
}

export default DynamicIframeTool
