import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeStore {
  mode: ThemeMode
  actualTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  initTheme: () => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      actualTheme: getSystemTheme(),
      
      setMode: (mode: ThemeMode) => {
        const actualTheme = mode === 'system' ? getSystemTheme() : mode
        applyTheme(actualTheme)
        
        // Save to electron-store if available
        if (window.electronAPI?.saveTheme) {
          window.electronAPI.saveTheme(mode)
        }
        
        set({ mode, actualTheme })
      },
      
      initTheme: () => {
        const { mode } = get()
        const actualTheme = mode === 'system' ? getSystemTheme() : mode
        applyTheme(actualTheme)
        set({ actualTheme })
        
        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            const { mode } = get()
            if (mode === 'system') {
              const newTheme = e.matches ? 'dark' : 'light'
              applyTheme(newTheme)
              set({ actualTheme: newTheme })
            }
          }
          mediaQuery.addEventListener('change', handleChange)
        }
      },
    }),
    {
      name: 'chimera-theme',
    }
  )
)
