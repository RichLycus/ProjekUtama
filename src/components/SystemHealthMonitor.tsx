import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { checkBackendHealth, getChatSystemStatus } from '../lib/api'
import type { HealthCheckResponse } from '../lib/api'
import { cn } from '../lib/utils'

interface SystemStatus {
  health: HealthCheckResponse | null
  chatStatus: any | null
  lastChecked: Date | null
  checking: boolean
}

export default function SystemHealthMonitor() {
  const [status, setStatus] = useState<SystemStatus>({
    health: null,
    chatStatus: null,
    lastChecked: null,
    checking: false
  })

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }))
    
    try {
      const [health, chatStatus] = await Promise.all([
        checkBackendHealth(),
        getChatSystemStatus()
      ])
      
      setStatus({
        health,
        chatStatus,
        lastChecked: new Date(),
        checking: false
      })
    } catch (error) {
      console.error('Status check failed:', error)
      setStatus(prev => ({ ...prev, checking: false }))
    }
  }

  useEffect(() => {
    // Initial check
    checkStatus()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(checkStatus, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (componentStatus: string) => {
    switch (componentStatus) {
      case 'ok':
      case 'connected':
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disconnected':
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (systemStatus: string) => {
    switch (systemStatus) {
      case 'healthy':
      case 'operational':
        return 'text-green-500'
      case 'degraded':
      case 'limited':
        return 'text-yellow-500'
      default:
        return 'text-red-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkStatus}
          disabled={status.checking}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 
                     rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn(
            "w-4 h-4",
            status.checking && "animate-spin"
          )} />
          <span className="text-sm">Refresh</span>
        </motion.button>
      </div>

      {/* Last Checked */}
      {status.lastChecked && (
        <p className="text-sm text-gray-500">
          Last checked: {status.lastChecked.toLocaleTimeString()}
        </p>
      )}

      {/* Backend Health */}
      {status.health && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Backend Status</h4>
            <span className={cn(
              "text-sm font-semibold uppercase",
              getStatusColor(status.health.status)
            )}>
              {status.health.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {status.health.ready ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm">
              {status.health.ready ? 'Ready to accept requests' : 'Initializing...'}
            </span>
          </div>

          {/* Components */}
          {status.health.components && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase">Components</p>
              
              {Object.entries(status.health.components).map(([component, componentStatus]) => (
                <div key={component} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{component.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(componentStatus)}
                    <span className="text-xs text-gray-500">{componentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Chat System Status */}
      {status.chatStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Chat System</h4>
            <span className={cn(
              "text-sm font-semibold uppercase",
              getStatusColor(status.chatStatus.status)
            )}>
              {status.chatStatus.status}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Orchestrator</span>
              <span className="font-mono text-xs text-gray-500">
                {status.chatStatus.orchestrator_type}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>LLM Integration</span>
              {getStatusIcon(status.chatStatus.llm_integrated ? 'connected' : 'disconnected')}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>RAG Active</span>
              {getStatusIcon(status.chatStatus.rag_active ? 'ok' : 'unavailable')}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Total Conversations</span>
              <span className="font-mono text-xs">{status.chatStatus.total_conversations}</span>
            </div>
          </div>

          {/* Agent Models */}
          {status.chatStatus.agent_models && 
           Object.keys(status.chatStatus.agent_models).length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Agent Models</p>
              <div className="space-y-1">
                {Object.entries(status.chatStatus.agent_models).map(([agent, modelConfig]: [string, any]) => (
                  <div key={agent} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-gray-600">{agent}</span>
                    <span className="font-mono text-gray-500">
                      {typeof modelConfig === 'object' && modelConfig !== null 
                        ? modelConfig.model || JSON.stringify(modelConfig)
                        : String(modelConfig)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {!status.health && !status.checking && status.lastChecked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl border border-red-200 dark:border-red-900 
                     bg-red-50 dark:bg-red-950/20"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Unable to connect to backend
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
