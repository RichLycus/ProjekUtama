import { X, Save, Trash2, Power, PowerOff, Code } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import LLMAgentConfig from './LLMAgentConfig'
import RAGConfig from './RAGConfig'
import RouterConfig from './RouterConfig'

interface NodeConfigPanelProps {
  node: Node | null
  onClose: () => void
  onSave?: (nodeId: string, config: any) => void
  onDelete?: (nodeId: string) => void
  onToggleEnabled?: (nodeId: string, enabled: boolean) => void
}

export default function NodeConfigPanel({
  node,
  onClose,
  onSave,
  onDelete,
  onToggleEnabled,
}: NodeConfigPanelProps) {
  const [nodeName, setNodeName] = useState('')
  const [nodeConfig, setNodeConfig] = useState<any>({})
  const [isEnabled, setIsEnabled] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [jsonText, setJsonText] = useState('{}')

  useEffect(() => {
    if (node) {
      setNodeName(node.data.nodeName || node.data.label || '')
      setIsEnabled(node.data.isEnabled ?? true)
      
      // Parse config if it's a string, otherwise use as-is
      const config = node.data.config
      if (typeof config === 'string') {
        try {
          setNodeConfig(JSON.parse(config))
          setJsonText(config)
        } catch {
          setNodeConfig({})
          setJsonText('{}')
        }
      } else {
        setNodeConfig(config || {})
        setJsonText(JSON.stringify(config || {}, null, 2))
      }
      
      setHasChanges(false)
      setShowJsonEditor(false)
    }
  }, [node])

  if (!node) return null

  const handleSave = () => {
    if (onSave) {
      onSave(node.id, {
        nodeName,
        config: nodeConfig,
        isEnabled,
      })
      setHasChanges(false)
    }
  }

  const handleConfigChange = (newConfig: any) => {
    setNodeConfig(newConfig)
    setJsonText(JSON.stringify(newConfig, null, 2))
    setHasChanges(true)
  }

  const handleJsonSave = () => {
    try {
      const parsed = JSON.parse(jsonText)
      setNodeConfig(parsed)
      setShowJsonEditor(false)
      setHasChanges(true)
    } catch (error) {
      alert('Invalid JSON configuration')
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      onDelete?.(node.id)
      onClose()
    }
  }

  const handleToggleEnabled = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    setHasChanges(true)
    onToggleEnabled?.(node.id, newEnabled)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-dark-card border-l border-gray-200 dark:border-dark-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            Node Configuration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {node.data.nodeType?.replace('_', ' ') || 'Unknown type'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Node name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => {
              setNodeName(e.target.value)
              setHasChanges(true)
            }}
            className="
              w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-dark-surface
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors
            "
            placeholder="Enter node name"
          />
        </div>

        {/* Node enabled toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-surface rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Power className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <PowerOff className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Node Status
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-dark-border"></div>

        {/* Per-type Configuration Form */}
        {!showJsonEditor && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuration
              </h3>
              <button
                onClick={() => {
                  setJsonText(JSON.stringify(nodeConfig, null, 2))
                  setShowJsonEditor(true)
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                JSON Editor
              </button>
            </div>

            {/* Render config form based on node type */}
            {node.data.nodeType === 'llm' && (
              <LLMAgentConfig
                config={nodeConfig}
                onChange={handleConfigChange}
              />
            )}

            {node.data.nodeType === 'rag_retriever' && (
              <RAGConfig
                config={nodeConfig}
                onChange={handleConfigChange}
              />
            )}

            {node.data.nodeType === 'router' && (
              <RouterConfig
                config={nodeConfig}
                onChange={handleConfigChange}
              />
            )}

            {/* For other node types (input, output, tool) - simple description */}
            {!['llm', 'rag_retriever', 'router'].includes(node.data.nodeType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={nodeConfig.description || ''}
                  onChange={(e) => handleConfigChange({ ...nodeConfig, description: e.target.value })}
                  className="
                    w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-dark-surface
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-colors
                  "
                  placeholder="Enter node description"
                />
              </div>
            )}
          </div>
        )}

        {/* JSON Editor (fallback) */}
        {showJsonEditor && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuration (JSON)
              </label>
              <button
                onClick={() => setShowJsonEditor(false)}
                className="text-xs text-primary hover:underline"
              >
                ← Back to Form
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-dark-surface
                text-gray-900 dark:text-white font-mono text-sm
                focus:ring-2 focus:ring-primary focus:border-transparent
                transition-colors resize-none
              "
              placeholder='{"key": "value"}'
            />
            <button
              onClick={handleJsonSave}
              className="
                mt-2 w-full px-4 py-2 rounded-lg
                bg-primary hover:bg-secondary text-white
                transition-colors font-medium text-sm
              "
            >
              Apply JSON Changes
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter valid JSON configuration for this node
            </p>
          </div>
        )}

        {/* Node info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Node ID:</strong> {node.id}
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-300 mt-1">
            <strong>Type:</strong> {node.data.nodeType}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-primary hover:bg-secondary text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors font-medium
            "
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className="
                p-2 rounded-lg
                hover:bg-red-100 dark:hover:bg-red-900/20
                text-red-600 dark:text-red-400
                transition-colors
              "
              title="Delete node"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
