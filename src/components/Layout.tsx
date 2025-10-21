import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import { useThemeStore } from '@/store/themeStore'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const initTheme = useThemeStore((state) => state.initTheme)
  const location = useLocation()
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()

  useEffect(() => {
    initTheme()
  }, [initTheme])

  const isChatPage = location.pathname === '/chat'

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    // This will be used by ChatPage
  }

  const handleNewChat = () => {
    setCurrentConversationId(undefined)
    // This will be used by ChatPage
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-background flex">
      <TitleBar />
      
      {/* Sidebar with conditional conversation list */}
      <Sidebar 
        currentConversationId={isChatPage ? currentConversationId : undefined}
        onSelectConversation={isChatPage ? handleSelectConversation : undefined}
        onNewChat={isChatPage ? handleNewChat : undefined}
      />
      
      {/* Main content area */}
      <main className={isChatPage ? "flex-1 pt-8 overflow-hidden" : "flex-1 pt-8 overflow-auto"}>
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