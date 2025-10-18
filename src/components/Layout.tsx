import { ReactNode, useEffect } from 'react'
import TitleBar from './TitleBar'
import Header from './Header'
import { useThemeStore } from '@/store/themeStore'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const initTheme = useThemeStore((state) => state.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-background">
      <TitleBar />
      <Header />
      <main className="pt-[88px]">
        {children}
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-text)',
            border: '1px solid var(--toast-border)',
          },
        }}
      />
    </div>
  )
}