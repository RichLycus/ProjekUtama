import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeCardProps {
  mode: 'light' | 'dark' | 'system'
  title: string
  description: string
  active: boolean
  onClick: () => void
}

export default function ThemeCard({ mode, title, description, active, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300',
        'border-2 hover:scale-[1.02]',
        active
          ? 'border-primary shadow-lg shadow-primary/30'
          : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
      )}
      data-testid={`theme-card-${mode}`}
    >
      {/* Active Indicator */}
      {active && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Theme Preview Mockup */}
      <div className="relative h-40 overflow-hidden">
        {mode === 'light' && (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            {/* Mini Window Mockup */}
            <div className="w-full h-full bg-white rounded-lg shadow-lg p-3 space-y-2">
              {/* Title Bar */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              {/* Content */}
              <div className="space-y-1.5">
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-blue-500 rounded-md w-20 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {mode === 'dark' && (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-950 p-4">
            {/* Mini Window Mockup */}
            <div className="w-full h-full bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg p-3 space-y-2">
              {/* Title Bar */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>
              {/* Content */}
              <div className="space-y-1.5">
                <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                <div className="h-6 bg-blue-500 rounded-md w-20 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {mode === 'system' && (
          <div className="w-full h-full bg-gradient-to-r from-gray-50 via-gray-200 to-gray-900 p-4 relative">
            {/* Split View Mockup */}
            <div className="w-full h-full flex gap-2">
              {/* Light Half */}
              <div className="flex-1 bg-white rounded-lg shadow-md p-2 space-y-1">
                <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                <div className="h-1.5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-blue-500 rounded w-12 mt-1"></div>
              </div>
              {/* Dark Half */}
              <div className="flex-1 bg-gray-800 rounded-lg shadow-md p-2 space-y-1 border border-gray-700">
                <div className="h-1.5 bg-gray-600 rounded w-full"></div>
                <div className="h-1.5 bg-gray-600 rounded w-2/3"></div>
                <div className="h-4 bg-blue-500 rounded w-12 mt-1"></div>
              </div>
            </div>
            {/* Auto Icon */}
            <div className="absolute bottom-2 right-2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
              AUTO
            </div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 bg-white dark:bg-dark-surface">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-secondary">{description}</p>
      </div>
    </button>
  )
}
