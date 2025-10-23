import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, Wrench, MessageSquare, Gamepad2, Settings, Search, User, Sun, Moon, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { useChatStore } from '@/store/chatStore'
import ConversationList, { ConversationListRef } from './chat/ConversationList'
import AgentStatusModal from './chat/AgentStatusModal'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  currentConversationId?: string
  onSelectConversation?: (id: string) => void
  onNewChat?: () => void
  onOpenPersonalSettings?: () => void
}

export default function Sidebar({ currentConversationId, onSelectConversation, onNewChat, onOpenPersonalSettings }: SidebarProps) {
  const location = useLocation()
  const { actualTheme, setMode } = useThemeStore()
  const { loading, setOnConversationCreated } = useChatStore()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [agentStatusOpen, setAgentStatusOpen] = useState(false)
  
  const conversationListRef = useRef<ConversationListRef>(null)

  const isChatPage = location.pathname === '/chat'
  const activeAgentsCount = loading ? 5 : 5 // All ready
  
  // Register callback to refresh conversations when new one is created
  useEffect(() => {
    setOnConversationCreated(() => {
      // Refresh conversation list
      conversationListRef.current?.refresh()
    })
  }, [])
  
  const toggleTheme = () => {
    setMode(actualTheme === 'dark' ? 'light' : 'dark')
  }

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setMobileOpen(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('mainSidebarCollapsed')
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('mainSidebarCollapsed', JSON.stringify(newCollapsed))
  }

  const sidebarWidth = collapsed ? 72 : 320

  return (
    <>
      {/* Agent Status Modal */}
      <AgentStatusModal
        isOpen={agentStatusOpen}
        onClose={() => setAgentStatusOpen(false)}
        loading={loading}
      />

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-10 left-4 z-[60] p-2 rounded-lg bg-white dark:bg-dark-surface shadow-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface-hover transition-colors"
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      )}

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !mobileOpen ? -sidebarWidth : 0,
          width: sidebarWidth
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          'fixed left-0 top-8 bottom-0 z-50 flex flex-col',
          'bg-white dark:bg-dark-surface',
          'border-r border-gray-200 dark:border-dark-border',
          'shadow-xl'
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Header - Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <img 
                src="/logo-128.png" 
                alt="ChimeraAI" 
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <h1 className="font-bold text-lg text-text dark:text-white">ChimeraAI</h1>
                <p className="text-xs text-text-muted dark:text-gray-400">Intelligent Assistant</p>
              </div>
            </div>
          )}
          {collapsed && (
            <img 
              src="/logo-128.png" 
              alt="ChimeraAI" 
              className="w-8 h-8 rounded-lg mx-auto"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 flex flex-col space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                onClick={() => isMobile && setMobileOpen(false)}
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 relative group',
                  isActive
                    ? 'bg-primary/20 text-primary dark:bg-primary/30'
                    : 'text-text-secondary dark:text-gray-300 hover:text-text dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface-hover',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                
                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                      {label}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Search - Show when not collapsed */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-dark-background border-none rounded-lg text-sm text-text dark:text-white placeholder-text-muted focus:ring-2 focus:ring-primary outline-none transition-all"
                data-testid="sidebar-search"
              />
            </div>
          </div>
        )}

        {/* Conversation List - Only show on chat page */}
        {isChatPage && !collapsed && onSelectConversation && onNewChat && (
          <div className="flex-1 overflow-hidden border-t border-gray-200 dark:border-dark-border">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-xs font-semibold text-text-muted dark:text-gray-500 uppercase">
                Conversations
              </h3>
              {/* Agent Status Button */}
              <button
                onClick={() => setAgentStatusOpen(true)}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
                data-testid="agent-status-button"
                title="Agent Status"
              >
                <Activity className="w-4 h-4 text-text dark:text-white" />
                {/* Badge */}
                <span className={cn(
                  'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center',
                  loading ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                )}>
                  {activeAgentsCount}
                </span>
              </button>
            </div>
            <div className="h-[calc(100%-40px)] overflow-y-auto px-3 py-2">
              <ConversationList
                ref={conversationListRef}
                currentConversationId={currentConversationId}
                onSelectConversation={onSelectConversation}
                onNewChat={onNewChat}
                collapsed={false}
              />
            </div>
          </div>
        )}

        {/* Spacer to push footer down when not in chat */}
        {(!isChatPage || collapsed) && <div className="flex-1" />}

        {/* Footer - Theme Toggle + Profile + Collapse */}
        <div className="p-3 border-t border-gray-200 dark:border-dark-border space-y-2">
          <div className={cn(
            'flex items-center',
            collapsed ? 'flex-col space-y-2' : 'justify-between'
          )}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors',
                actualTheme === 'dark'
                  ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                collapsed && 'w-full flex justify-center'
              )}
              data-testid="theme-toggle"
              title={actualTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {actualTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Button */}
            <button
              onClick={onOpenPersonalSettings}
              className={cn(
                'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors',
                collapsed && 'w-full flex justify-center'
              )}
              data-testid="profile-button"
              title="Personal Settings"
            >
              <User className="w-5 h-5 text-text-secondary dark:text-gray-300" />
            </button>
          </div>

          {/* Collapse/Expand Button */}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors flex items-center justify-center gap-2 text-sm font-medium text-text-secondary dark:text-gray-300"
              data-testid="toggle-sidebar"
            >
              {collapsed ? (
                <>
                  <ChevronRight className="w-4 h-4" />
                  {!collapsed && <span>Expand</span>}
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.aside>

      {/* Spacer to prevent content from going under sidebar */}
      <div style={{ width: isMobile ? 0 : sidebarWidth }} className="flex-shrink-0 transition-all duration-300" />
    </>
  )
}
