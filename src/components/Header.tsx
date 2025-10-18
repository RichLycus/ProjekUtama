import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, Wrench, MessageSquare, Gamepad2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-strong border-b border-border">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
            <span className="text-xl font-bold text-white">C</span>
          </div>
          <span className="text-xl font-display font-bold text-text group-hover:text-primary transition-colors">
            ChimeraAI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
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
    </header>
  )
}