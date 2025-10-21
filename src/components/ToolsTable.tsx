import { Edit, Trash2, Power, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react'
import { Tool } from '@/store/toolsStore'
import { cn } from '@/lib/utils'

interface ToolsTableProps {
  tools: Tool[]
  onEdit: (tool: Tool) => void
  onDelete: (toolId: string) => void
  onToggle: (toolId: string) => void
  onViewLogs: (toolId: string) => void
  onSettings: (tool: Tool) => void
}

export default function ToolsTable({ tools, onEdit, onDelete, onToggle, onViewLogs, onSettings }: ToolsTableProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 text-green-500 text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        Disabled
      </span>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Office: 'bg-category-office',
      DevTools: 'bg-category-devtools',
      Multimedia: 'bg-category-multimedia',
      Utilities: 'bg-category-utilities',
      Security: 'bg-category-security',
      Network: 'bg-category-network',
      Data: 'bg-category-data',
    }
    return colors[category] || 'bg-primary'
  }

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-16 h-16 text-secondary mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Tools Found</h3>
        <p className="text-secondary">Upload your first Python tool to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="tools-table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-dark-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Tool Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Version</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Author</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Created</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr
              key={tool._id}
              className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
              data-testid={`tool-row-${tool._id}`}
            >
              <td className="py-4 px-4">
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-secondary line-clamp-1">{tool.description}</p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span
                  className={cn(
                    getCategoryColor(tool.category),
                    'text-xs px-2 py-1 rounded-md text-white font-medium'
                  )}
                >
                  {tool.category}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm">v{tool.version}</span>
              </td>
              <td className="py-4 px-4">
                {getStatusBadge(tool.status)}
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-secondary">{tool.author}</span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-secondary">
                  {new Date(tool.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2">
                  {/* Settings Button */}
                  <button
                    onClick={() => onSettings(tool)}
                    className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 transition-all"
                    title="Tool settings & dependencies"
                    data-testid={`settings-tool-${tool._id}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(tool)}
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 transition-all"
                    title="Edit tool"
                    data-testid={`edit-tool-${tool._id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Toggle Button */}
                  <button
                    onClick={() => onToggle(tool._id)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      tool.status === 'active'
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-500'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
                    )}
                    title={tool.status === 'active' ? 'Disable' : 'Enable'}
                    data-testid={`toggle-tool-${tool._id}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {/* View Logs Button */}
                  <button
                    onClick={() => onViewLogs(tool._id)}
                    className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 transition-all"
                    title="View logs"
                    data-testid={`logs-tool-${tool._id}`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(tool._id)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-all"
                    title="Delete tool"
                    data-testid={`delete-tool-${tool._id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}