import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, Wrench, MessageSquare, Gamepad2, Settings, Minus, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Header() {
  const location = useLocation()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow()
      // Toggle state
      setIsMaximized(!isMaximized)
    }
  }

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-strong border-b border-border select-none">
      <div className="h-full flex items-center">
        {/* Draggable Region */}
        <div 
          className="flex-1 h-full flex items-center px-6"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <span className="text-xl font-display font-bold text-text group-hover:text-primary transition-colors">
              ChimeraAI
            </span>
          </Link>

          {/* Navigation - centered */}
          <nav 
            className="flex items-center gap-2 ml-auto mr-4"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  data-testid={`nav-${label.toLowerCase()}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-text-secondary hover:text-text hover:bg-surface/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Window Controls */}
        <div 
          className="flex items-center h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="h-full px-4 hover:bg-surface/50 transition-colors group"
            aria-label="Minimize"
            data-testid="window-minimize"
          >
            <Minus className="w-4 h-4 text-text-secondary group-hover:text-text" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-4 hover:bg-surface/50 transition-colors group"
            aria-label="Maximize"
            data-testid="window-maximize"
          >
            <Square className="w-3.5 h-3.5 text-text-secondary group-hover:text-text" />
          </button>
          <button
            onClick={handleClose}
            className="h-full px-4 hover:bg-red-500 transition-colors group"
            aria-label="Close"
            data-testid="window-close"
          >
            <X className="w-4 h-4 text-text-secondary group-hover:text-white" />
          </button>
        </div>
      </div>
    </header>
  )
}
