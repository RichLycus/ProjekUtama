import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, Wrench, MessageSquare, Gamepad2, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle'

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
    <header className="fixed top-8 left-0 right-0 z-50 h-14 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border select-none shadow-lg">
      <div className="h-full flex items-center px-6">
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
                    : 'text-secondary hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Section: Theme Toggle + Profile */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
            aria-label="Profile"
            data-testid="profile-button"
          >
            <User className="w-5 h-5 text-secondary" />
          </button>
        </div>
      </div>
    </header>
  )
}
