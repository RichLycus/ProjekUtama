import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import PersonalSettingsModal from './chat/PersonalSettingsModal'
import { useThemeStore } from '@/store/themeStore'
import { useChatStore } from '@/store/chatStore'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const initTheme = useThemeStore((state) => state.initTheme)
  const { loadHistory, createNewConversation } = useChatStore()
  const location = useLocation()
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()
  const [showPersonalSettings, setShowPersonalSettings] = useState(false)

  useEffect(() => {
    initTheme()
  }, [initTheme])
  
  // Listen for global event to open personal settings
  useEffect(() => {
    const handleOpenPersonalSettings = () => {
      setShowPersonalSettings(true)
    }
    
    window.addEventListener('openPersonalSettings', handleOpenPersonalSettings)
    return () => {
      window.removeEventListener('openPersonalSettings', handleOpenPersonalSettings)
    }
  }, [])

  const isChatPage = location.pathname === '/chat'

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id)
    // Load conversation history from backend
    await loadHistory(id)
  }

  const handleNewChat = () => {
    setCurrentConversationId(undefined)
    // Create new conversation
    createNewConversation()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-background flex">
      <TitleBar />
      
      {/* Sidebar with conditional conversation list */}
      <Sidebar 
        currentConversationId={isChatPage ? currentConversationId : undefined}
        onSelectConversation={isChatPage ? handleSelectConversation : undefined}
        onNewChat={isChatPage ? handleNewChat : undefined}
        onOpenPersonalSettings={() => setShowPersonalSettings(true)}
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
      
      {/* Global Personal Settings Modal */}
      <PersonalSettingsModal
        isOpen={showPersonalSettings}
        onClose={() => setShowPersonalSettings(false)}
      />
    </div>
  )
}