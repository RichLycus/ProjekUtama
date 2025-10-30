import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ScrollText, CheckCircle, XCircle, AlertCircle, Info, Clock, Activity, Zap, Database } from 'lucide-react'
import { BACKEND_URL } from '@/lib/backend'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Log {
  _id: string
  tool_id: string
  action: string
  status: string
  message: string
  trace: string
  timestamp: string
}

export default function ToolLogsPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  
  const [toolName, setToolName] = useState<string>('')
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch tool info
  const fetchToolInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}`)
      const data = await response.json()
      if (data) {
        setToolName(data.name)
      }
    } catch (error) {
      console.error('Failed to fetch tool info:', error)
    }
  }

  // Fetch logs
  const fetchLogs = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/logs?limit=100`)
      const data = await response.json()
      
      if (data && data.logs) {
        setLogs(data.logs)
        if (showRefreshToast) {
          toast.success(`✅ Logs refreshed (${data.logs.length} entries)`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      toast.error('❌ Failed to fetch logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (toolId) {
      fetchToolInfo()
      fetchLogs()
    }
  }, [toolId])

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && toolId) {
      const interval = setInterval(() => {
        fetchLogs()
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, toolId])

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const statusLower = status.toLowerCase()
    
    if (statusLower === 'success') {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-500/20',
        label: 'Success'
      }
    } else if (statusLower === 'error' || statusLower === 'failed') {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/20',
        label: 'Error'
      }
    } else if (statusLower === 'warning') {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/20',
        label: 'Warning'
      }
    } else {
      return {
        icon: Info,
        color: 'text-blue-500',
        bg: 'bg-blue-500/20',
        label: 'Info'
      }
    }
  }

  // Get action icon
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('execute') || actionLower.includes('run')) {
      return Zap
    } else if (actionLower.includes('upload') || actionLower.includes('create')) {
      return Database
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return RefreshCw
    } else {
      return Activity
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // Relative time
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    // Absolute time
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]">
      {/* Header */}
      <div className="glass-strong border-b border-gray-200 dark:border-dark-border">
        <div className="px-4 md:px-6 py-4">
          {/* Back Button + Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-all"
                title="Back to Settings"
                data-testid="back-to-settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold">Tool Logs</h1>
                  <p className="text-sm text-secondary">{toolName || 'Loading...'}</p>
                </div>
              </div>
            </div>

            {/* Auto-refresh Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-secondary">Auto-refresh</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>

              {/* Manual Refresh Button */}
              <button
                onClick={() => fetchLogs(true)}
                disabled={refreshing}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                  refreshing
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-primary hover:bg-secondary text-white'
                )}
                title="Refresh logs"
                data-testid="refresh-logs"
              >
                <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-secondary mb-1">Total Logs</p>
              <p className="text-xl font-bold">{logs.length}</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-secondary mb-1">Success</p>
              <p className="text-xl font-bold text-green-500">
                {logs.filter(l => l.status.toLowerCase() === 'success').length}
              </p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-secondary mb-1">Errors</p>
              <p className="text-xl font-bold text-red-500">
                {logs.filter(l => ['error', 'failed'].includes(l.status.toLowerCase())).length}
              </p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-secondary mb-1">Warnings</p>
              <p className="text-xl font-bold text-yellow-500">
                {logs.filter(l => l.status.toLowerCase() === 'warning').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-secondary">Loading logs...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 glass-strong rounded-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <ScrollText className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Logs Yet</h3>
              <p className="text-secondary max-w-md text-center mb-6">
                This tool hasn't generated any logs yet. Logs will appear here when the tool is executed or modified.
              </p>
              {autoRefresh && (
                <p className="text-sm text-primary font-medium">
                  🔄 Auto-refresh is enabled - waiting for logs...
                </p>
              )}
            </div>
          )}

          {/* Logs List */}
          {!loading && logs.length > 0 && (
            <div className="space-y-3">
              {logs.map((log) => {
                const statusDisplay = getStatusDisplay(log.status)
                const ActionIcon = getActionIcon(log.action)
                const StatusIcon = statusDisplay.icon

                return (
                  <div
                    key={log._id}
                    className="glass rounded-xl p-4 md:p-5 hover:glass-strong transition-all border border-gray-200 dark:border-dark-border"
                    data-testid={`log-entry-${log._id}`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      {/* Left: Action + Status */}
                      <div className="flex items-center gap-3">
                        {/* Action Icon */}
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <ActionIcon className="w-5 h-5 text-primary" />
                        </div>

                        {/* Action + Status Badge */}
                        <div>
                          <h4 className="font-semibold text-base">{log.action}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
                                statusDisplay.bg,
                                statusDisplay.color
                              )}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusDisplay.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-3">
                      <p className="text-sm text-secondary leading-relaxed">{log.message}</p>
                    </div>

                    {/* Trace (if exists) */}
                    {log.trace && log.trace.trim() !== '' && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-primary hover:text-secondary transition-colors flex items-center gap-1">
                          <span>Show trace details</span>
                          <span className="transform group-open:rotate-90 transition-transform">▶</span>
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 dark:bg-dark-surface rounded-lg text-xs overflow-x-auto custom-scrollbar font-mono">
                          {log.trace}
                        </pre>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
