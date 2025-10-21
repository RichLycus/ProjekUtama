import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Download, CheckCircle, AlertCircle, Loader2, RefreshCw, Terminal } from 'lucide-react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/backend'
import toast from 'react-hot-toast'

interface ToolSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  toolId: string
  toolName: string
  onDependenciesInstalled?: () => void
}

interface DependencyStatus {
  python: {
    dependencies: string[]
    installed: string[]
    missing: string[]
  }
  node: {
    dependencies: string[]
    installed: string[]
    missing: string[]
  }
  all_installed: boolean
}

export default function ToolSettingsModal({
  isOpen,
  onClose,
  toolId,
  toolName,
  onDependenciesInstalled
}: ToolSettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [depStatus, setDepStatus] = useState<DependencyStatus | null>(null)
  const [installing, setInstalling] = useState<'python' | 'node' | 'all' | null>(null)
  const [installOutput, setInstallOutput] = useState<string>('')
  const [restarting, setRestarting] = useState(false)

  // Load dependency status when modal opens
  useEffect(() => {
    if (isOpen && toolId) {
      loadDependencies()
    }
  }, [isOpen, toolId])

  const loadDependencies = async () => {
    setLoading(true)
    try {
      const response = await axios.get(API_ENDPOINTS.tools.dependencies(toolId))
      if (response.data.success) {
        setDepStatus(response.data.dependencies)
      }
    } catch (error: any) {
      toast.error(`Failed to load dependencies: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const installPythonDeps = async () => {
    setInstalling('python')
    setInstallOutput('')
    try {
      const response = await axios.post(API_ENDPOINTS.tools.installPythonDeps(toolId))
      setInstallOutput(response.data.output || response.data.message)
      
      if (response.data.success) {
        toast.success('Python dependencies installed successfully!')
        await loadDependencies() // Reload status
        onDependenciesInstalled?.()
      } else {
        toast.error('Python installation failed')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message
      toast.error(`Installation failed: ${errorMsg}`)
      setInstallOutput(errorMsg)
    } finally {
      setInstalling(null)
    }
  }

  const installNodeDeps = async () => {
    setInstalling('node')
    setInstallOutput('')
    try {
      const response = await axios.post(API_ENDPOINTS.tools.installNodeDeps(toolId))
      setInstallOutput(response.data.output || response.data.message)
      
      if (response.data.success) {
        toast.success('Node.js dependencies installed successfully!')
        await loadDependencies() // Reload status
        onDependenciesInstalled?.()
      } else {
        toast.error('Node.js installation failed')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message
      toast.error(`Installation failed: ${errorMsg}`)
      setInstallOutput(errorMsg)
    } finally {
      setInstalling(null)
    }
  }

  const installAllDeps = async () => {
    setInstalling('all')
    setInstallOutput('')
    try {
      const response = await axios.post(API_ENDPOINTS.tools.installAllDeps(toolId))
      
      if (response.data.success) {
        toast.success('All dependencies installed successfully! Tool is now active.')
        await loadDependencies() // Reload status
        onDependenciesInstalled?.()
      } else {
        toast.error('Some dependencies failed to install')
      }
      
      // Show detailed output
      const pythonMsg = response.data.results?.python?.message || ''
      const nodeMsg = response.data.results?.node?.message || ''
      setInstallOutput(`Python: ${pythonMsg}\n\nNode.js: ${nodeMsg}`)
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message
      toast.error(`Installation failed: ${errorMsg}`)
      setInstallOutput(errorMsg)
    } finally {
      setInstalling(null)
    }
  }

  const restartApplication = async () => {
    setRestarting(true)
    try {
      const response = await axios.post(API_ENDPOINTS.system.restart)
      if (response.data.success) {
        toast.success(`Application restarted! ${response.data.mounted_tools} tools mounted.`)
      }
    } catch (error: any) {
      toast.error(`Restart failed: ${error.response?.data?.detail || error.message}`)
    } finally {
      setRestarting(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const hasPythonDeps = depStatus && depStatus.python.dependencies.length > 0
  const hasNodeDeps = depStatus && depStatus.node.dependencies.length > 0
  const hasMissingDeps = depStatus && (!depStatus.all_installed)

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            data-testid="tool-settings-backdrop"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 z-10 max-h-[90vh] overflow-hidden"
            data-testid="tool-settings-modal"
          >
            <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text dark:text-white">
                      Tool Settings
                    </h2>
                    <p className="text-sm text-text-muted dark:text-gray-400">
                      {toolName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
                  data-testid="close-tool-settings"
                >
                  <X className="w-5 h-5 text-text dark:text-gray-400" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Dependency Status Overview */}
                    {hasMissingDeps && (
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                              Dependencies Required
                            </h3>
                            <p className="text-sm text-yellow-600 dark:text-yellow-300">
                              This tool requires dependencies to be installed before it can be enabled.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {depStatus?.all_installed && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                              All Dependencies Installed
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              This tool is ready to use!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Python Dependencies */}
                    {hasPythonDeps && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-text dark:text-white flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Python Dependencies ({depStatus.python.dependencies.length})
                          </h3>
                          {depStatus.python.missing.length > 0 && (
                            <button
                              onClick={installPythonDeps}
                              disabled={installing !== null}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                            >
                              {installing === 'python' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Installing...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  Install Python Deps
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {depStatus.python.dependencies.map((dep) => {
                            const isInstalled = depStatus.python.installed.includes(dep)
                            return (
                              <div
                                key={dep}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-surface"
                              >
                                <span className="text-sm font-mono text-text dark:text-white">
                                  {dep}
                                </span>
                                {isInstalled ? (
                                  <span className="flex items-center gap-1 text-xs text-green-500">
                                    <CheckCircle className="w-4 h-4" />
                                    Installed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                                    <AlertCircle className="w-4 h-4" />
                                    Missing
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Node.js Dependencies */}
                    {hasNodeDeps && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-text dark:text-white flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Node.js Dependencies ({depStatus.node.dependencies.length})
                          </h3>
                          {depStatus.node.missing.length > 0 && (
                            <button
                              onClick={installNodeDeps}
                              disabled={installing !== null}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                            >
                              {installing === 'node' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Installing...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  Install Node Deps
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {depStatus.node.dependencies.map((dep) => {
                            const isInstalled = depStatus.node.installed.includes(dep)
                            return (
                              <div
                                key={dep}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-surface"
                              >
                                <span className="text-sm font-mono text-text dark:text-white">
                                  {dep}
                                </span>
                                {isInstalled ? (
                                  <span className="flex items-center gap-1 text-xs text-green-500">
                                    <CheckCircle className="w-4 h-4" />
                                    Installed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                                    <AlertCircle className="w-4 h-4" />
                                    Missing
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* No Dependencies */}
                    {!hasPythonDeps && !hasNodeDeps && (
                      <div className="text-center py-8 text-text-muted dark:text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No dependencies detected for this tool</p>
                      </div>
                    )}

                    {/* Installation Output */}
                    {installOutput && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-text dark:text-white flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          Installation Output
                        </h3>
                        <pre className="p-4 rounded-lg bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto max-h-40">
                          {installOutput}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
                <button
                  onClick={restartApplication}
                  disabled={restarting}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {restarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Restarting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Restart Application
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  {hasMissingDeps && (
                    <button
                      onClick={installAllDeps}
                      disabled={installing !== null}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {installing === 'all' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Installing All...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Install All Dependencies
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-surface-hover text-text dark:text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
