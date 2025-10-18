import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { mode, actualTheme, setMode } = useThemeStore()

  const toggleTheme = () => {
    if (mode === 'system') {
      setMode('light')
    } else if (actualTheme === 'light') {
      setMode('dark')
    } else {
      setMode('light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg transition-all duration-200',
        actualTheme === 'light'
          ? 'bg-gray-100 text-yellow-600 hover:bg-gray-200'
          : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
      )}
      aria-label="Toggle theme"
      data-testid="theme-toggle"
    >
      {actualTheme === 'light' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
