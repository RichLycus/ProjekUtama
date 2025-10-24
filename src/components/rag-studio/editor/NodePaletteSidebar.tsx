import { FileInput, GitBranch, Database, Sparkles, FileOutput } from 'lucide-react'
import { DragEvent } from 'react'

interface NodeTemplate {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'input',
    label: 'Input',
    icon: FileInput,
    color: 'bg-blue-500',
    description: 'Process user input'
  },
  {
    type: 'router',
    label: 'Router',
    icon: GitBranch,
    color: 'bg-purple-500',
    description: 'Route based on conditions'
  },
  {
    type: 'rag_retriever',
    label: 'RAG Retriever',
    icon: Database,
    color: 'bg-green-500',
    description: 'Retrieve from knowledge base'
  },
  {
    type: 'llm',
    label: 'LLM',
    icon: Sparkles,
    color: 'bg-orange-500',
    description: 'Generate AI response'
  },
  {
    type: 'output',
    label: 'Output',
    icon: FileOutput,
    color: 'bg-pink-500',
    description: 'Return final result'
  },
]

interface NodePaletteSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function NodePaletteSidebar({ isOpen, onClose }: NodePaletteSidebarProps) {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full
          w-80 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border
          shadow-xl lg:shadow-none
          transition-transform duration-300 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Node Palette
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag nodes to canvas
            </p>
          </div>
          
          {/* Node templates */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {NODE_TEMPLATES.map((template) => {
              const Icon = template.icon
              return (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type)}
                  className="
                    group cursor-move p-4 rounded-lg border-2 border-dashed
                    border-gray-300 dark:border-gray-600
                    hover:border-primary dark:hover:border-primary
                    hover:bg-gray-50 dark:hover:bg-dark-surface
                    transition-all duration-200
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className={`${template.color} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {template.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Footer hint */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 <strong>Tip:</strong> Drag a node onto the canvas to add it to your workflow
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
