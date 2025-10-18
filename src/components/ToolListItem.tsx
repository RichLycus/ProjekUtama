import { Play } from 'lucide-react'
import { Tool } from '@/store/toolsStore'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  Office: 'text-category-office',
  DevTools: 'text-category-devtools',
  Multimedia: 'text-category-multimedia',
  Utilities: 'text-category-utilities',
  Security: 'text-category-security',
  Network: 'text-category-network',
  Data: 'text-category-data',
}

interface ToolListItemProps {
  tool: Tool
  onExecute: () => void
}

export default function ToolListItem({
  tool,
  onExecute,
}: ToolListItemProps) {
  const categoryColor = CATEGORY_COLORS[tool.category] || 'text-primary'

  return (
    <div
      className="glass rounded-xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-4 cursor-pointer"
      onClick={tool.status === 'active' ? onExecute : undefined}
      data-testid={`tool-list-${tool._id}`}
    >
      {/* Status Badge */}
      <div
        className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0',
          tool.status === 'active' 
            ? 'bg-green-500/20 text-green-700 dark:text-green-600' 
            : 'bg-red-500/20 text-red-700 dark:text-red-600'
        )}
      >
        {tool.status === 'active' ? '● Ready' : '● Disabled'}
      </div>

      {/* Tool Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-lg">{tool.name}</h3>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-md bg-primary/10', categoryColor)}>
            {tool.category}
          </span>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">v{tool.version}</span>
        </div>
        <p className="text-sm text-secondary truncate">{tool.description}</p>
      </div>

      {/* Meta Info */}
      <div className="hidden lg:flex items-center gap-6 text-sm text-muted">
        <div>
          <span className="block text-xs text-secondary">Author</span>
          <span className="font-medium">{tool.author}</span>
        </div>
        <div>
          <span className="block text-xs text-secondary">Created</span>
          <span className="font-medium">{new Date(tool.created_at).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="block text-xs text-secondary">Dependencies</span>
          <span className="font-medium">{tool.dependencies?.length || 0}</span>
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onExecute()
          }}
          disabled={tool.status !== 'active'}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
            tool.status === 'active'
              ? 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
          )}
          data-testid={`execute-tool-${tool._id}`}
        >
          <Play className="w-4 h-4" />
          {tool.status === 'active' ? 'Run Tool' : 'Disabled'}
        </button>
      </div>
    </div>
  )
}
