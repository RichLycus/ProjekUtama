import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => {
    console.log('[TitleBar] Minimize clicked, electronAPI available:', !!window.electronAPI)
    if (window.electronAPI) {
      console.log('[TitleBar] Calling electronAPI.minimizeWindow()')
      window.electronAPI.minimizeWindow()
    } else {
      console.error('[TitleBar] electronAPI not available!')
    }
  }

  const handleMaximize = () => {
    console.log('[TitleBar] Maximize clicked, electronAPI available:', !!window.electronAPI)
    if (window.electronAPI) {
      console.log('[TitleBar] Calling electronAPI.maximizeWindow()')
      window.electronAPI.maximizeWindow()
      setIsMaximized(!isMaximized)
    } else {
      console.error('[TitleBar] electronAPI not available!')
    }
  }

  const handleClose = () => {
    console.log('[TitleBar] Close clicked, electronAPI available:', !!window.electronAPI)
    if (window.electronAPI) {
      console.log('[TitleBar] Calling electronAPI.closeWindow()')
      window.electronAPI.closeWindow()
    } else {
      console.error('[TitleBar] electronAPI not available!')
    }
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-4 select-none z-[100]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <Link 
        to="/" 
        className="flex items-center gap-2 group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <span className="text-sm font-display font-semibold group-hover:text-primary transition-colors">
          ChimeraAI
        </span>
      </Link>

      {/* Window Controls */}
      <div 
        className="flex items-center h-full -mr-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors group"
          aria-label="Minimize"
          data-testid="window-minimize"
        >
          <Minus className="w-3.5 h-3.5 text-secondary group-hover:text-gray-900 dark:group-hover:text-white" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors group"
          aria-label="Maximize"
          data-testid="window-maximize"
        >
          <Square className="w-3 h-3 text-secondary group-hover:text-gray-900 dark:group-hover:text-white" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 transition-colors group"
          aria-label="Close"
          data-testid="window-close"
        >
          <X className="w-3.5 h-3.5 text-secondary group-hover:text-white" />
        </button>
      </div>
    </div>
  )
}
