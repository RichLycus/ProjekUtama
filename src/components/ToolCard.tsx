import { Play, Package } from 'lucide-react'
import { Tool } from '@/store/toolsStore'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  Office: 'bg-category-office',
  DevTools: 'bg-category-devtools',
  Multimedia: 'bg-category-multimedia',
  Utilities: 'bg-category-utilities',
  Security: 'bg-category-security',
  Network: 'bg-category-network',
  Data: 'bg-category-data',
}

interface ToolCardProps {
  tool: Tool
  onExecute: () => void
}

export default function ToolCard({
  tool,
  onExecute,
}: ToolCardProps) {
  const categoryColor = CATEGORY_COLORS[tool.category] || 'bg-primary'

  return (
    <div
      className="glass rounded-xl p-4 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
      onClick={tool.status === 'active' ? onExecute : undefined}
      data-testid={`tool-card-${tool._id}`}
    >
      {/* Status Indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              tool.status === 'active' 
                ? 'bg-green-500/20 text-green-700 dark:text-green-600' 
                : 'bg-red-500/20 text-red-700 dark:text-red-600'
            )}
          >
            {tool.status === 'active' ? '● Ready' : '● Disabled'}
          </div>
          {tool.tool_type && (
            <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-700 dark:text-purple-400">
              {tool.tool_type === 'frontend' ? '⚛️ UI' : '🐍 BE'}
            </div>
          )}
        </div>
        <div
          className={cn(
            categoryColor,
            'text-xs px-2 py-0.5 rounded-full text-white font-medium'
          )}
        >
          {tool.category}
        </div>
      </div>

      {/* Tool Icon/Name */}
      <div className="mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <span className="text-xl">🛠️</span>
        </div>
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{tool.name}</h3>
        <p className="text-xs text-secondary line-clamp-2 min-h-[2rem]">{tool.description}</p>
      </div>

      {/* Version & Dependencies */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
          v{tool.version}
        </span>
        {tool.dependencies && tool.dependencies.length > 0 && (
          <div className="flex items-center gap-1 text-secondary">
            <Package className="w-3 h-3" />
            <span>{tool.dependencies.length}</span>
          </div>
        )}
      </div>

      {/* Execute Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onExecute()
        }}
        disabled={tool.status !== 'active'}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
          tool.status === 'active'
            ? 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
        )}
        data-testid={`execute-tool-${tool._id}`}
      >
        <Play className="w-3.5 h-3.5" />
        {tool.status === 'active' ? 'Run Tool' : 'Disabled'}
      </button>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border text-xs text-muted flex justify-between">
        <span className="truncate flex-1">By {tool.author}</span>
        <span className="ml-2 flex-shrink-0">{new Date(tool.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}