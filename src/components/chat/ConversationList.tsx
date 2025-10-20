import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Search, Plus, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

interface Conversation {
  id: string
  title: string
  persona: string
  created_at: string
  updated_at: string
}

interface ConversationListProps {
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function ConversationList({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  collapsed = false,
  onToggleCollapse
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch conversations
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/chat/conversations`)
      setConversations(response.data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return

    try {
      await axios.delete(`${BACKEND_URL}/api/chat/conversations/${id}`)
      setConversations(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    const conv = conversations.find(c => c.id === id)
    setEditTitle(conv?.title || '')
  }

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editTitle.trim()) return

    try {
      await axios.put(`${BACKEND_URL}/api/chat/conversations/${id}`, {
        title: editTitle.trim()
      })
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)
      )
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update conversation:', error)
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditTitle('')
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by time
  const groupByTime = (convs: Conversation[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const lastWeek = new Date(today.getTime() - 7 * 86400000)

    return {
      today: convs.filter(c => new Date(c.updated_at) >= today),
      yesterday: convs.filter(c => {
        const date = new Date(c.updated_at)
        return date >= yesterday && date < today
      }),
      lastWeek: convs.filter(c => {
        const date = new Date(c.updated_at)
        return date >= lastWeek && date < yesterday
      }),
      older: convs.filter(c => new Date(c.updated_at) < lastWeek)
    }
  }

  const grouped = groupByTime(filteredConversations)

  const renderConversationGroup = (title: string, convs: Conversation[]) => {
    if (convs.length === 0) return null

    return (
      <div key={title} className="mb-3">
        {!collapsed && (
          <h3 className="text-[10px] font-semibold text-text-muted dark:text-gray-500 uppercase px-2 mb-1.5">
            {title}
          </h3>
        )}
        <div className="space-y-0.5">
          {convs.map(conv => (
            <motion.button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full rounded-lg text-left transition-all group relative
                ${collapsed ? 'p-1.5 flex justify-center' : 'px-2 py-2'}
                ${currentConversationId === conv.id
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-text dark:text-gray-300'
                }
              `}
              data-testid={`conversation-${conv.id}`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                <MessageSquare className={`flex-shrink-0 ${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                {!collapsed && editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(conv.id, e as any)
                        if (e.key === 'Escape') handleCancelEdit(e as any)
                      }}
                    />
                    <button
                      onClick={(e) => handleSaveEdit(conv.id, e)}
                      className="p-0.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-xs font-medium truncate">
                          {conv.title || 'New Conversation'}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEdit(conv.id, e)}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(conv.id, e)}
                            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    {conv.title || 'New Conversation'}
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // Collapsed view
  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-dark-background">
        {/* New Chat Icon */}
        <div className="p-2 mb-2">
          <motion.button
            onClick={onNewChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center transition-colors shadow-md group relative"
            data-testid="new-chat-button-collapsed"
          >
            <Plus className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                New Chat
              </div>
            </div>
          </motion.button>
        </div>

        {/* Conversations - Icon only */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {loading ? (
            <div className="text-center py-4">
              <MessageSquare className="w-5 h-5 text-text-muted dark:text-gray-500 mx-auto animate-pulse" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-4">
              <MessageSquare className="w-5 h-5 text-text-muted dark:text-gray-500 mx-auto opacity-30" />
            </div>
          ) : (
            <>
              {grouped.today.map(conv => (
                <motion.button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    w-full h-10 rounded-lg flex items-center justify-center transition-all group relative
                    ${currentConversationId === conv.id
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-text dark:text-gray-300'
                    }
                  `}
                >
                  <MessageSquare className="w-4 h-4" />
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl max-w-xs truncate">
                      {conv.title || 'New Conversation'}
                    </div>
                  </div>
                </motion.button>
              ))}
            </>
          )}
        </div>

        {/* Toggle collapse button - Bottom */}
        {onToggleCollapse && (
          <div className="p-2 border-t border-gray-200 dark:border-dark-border">
            <motion.button
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-text dark:text-white transition-colors flex items-center justify-center group relative"
              data-testid="toggle-sidebar-expand"
            >
              <ChevronRight className="w-4 h-4" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                  Expand
                </div>
              </div>
            </motion.button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-background">
      {/* Header - New Chat */}
      <div className="p-2 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
        <motion.button
          onClick={onNewChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
          data-testid="new-chat-button"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </motion.button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-gray-100 dark:bg-dark-surface border-none rounded-lg text-xs text-text dark:text-white placeholder-text-muted focus:ring-2 focus:ring-primary outline-none"
            data-testid="search-conversations"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {loading ? (
          <div className="text-center py-4 text-text-muted dark:text-gray-500 text-xs">
            Loading...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-4 text-text-muted dark:text-gray-500 text-xs">
            {searchQuery ? 'No results' : 'No conversations'}
          </div>
        ) : (
          <>
            {renderConversationGroup('Today', grouped.today)}
            {renderConversationGroup('Yesterday', grouped.yesterday)}
            {renderConversationGroup('Last 7 days', grouped.lastWeek)}
            {renderConversationGroup('Older', grouped.older)}
          </>
        )}
      </div>

      {/* Toggle collapse button */}
      {onToggleCollapse && (
        <div className="p-2 border-t border-gray-200 dark:border-dark-border flex-shrink-0">
          <motion.button
            onClick={onToggleCollapse}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-text dark:text-white transition-colors flex items-center justify-center gap-2 text-xs font-medium"
            data-testid="toggle-sidebar-collapse"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Collapse</span>
          </motion.button>
        </div>
      )}
    </div>
  )
}
