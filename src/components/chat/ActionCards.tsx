import { motion } from 'framer-motion'
import { Search, Lightbulb, FileText, Palette } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../lib/utils'

interface ActionCardsProps {
  onActionClick: (prompt: string) => void
}

export default function ActionCards({ onActionClick }: ActionCardsProps) {
  const { actualTheme } = useThemeStore()
  
  const actions = [
    {
      icon: Search,
      title: 'Search Information',
      subtitle: 'Find answers quickly',
      prompt: 'Help me search for information about ',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Lightbulb,
      title: 'Get Ideas',
      subtitle: 'Creative solutions',
      prompt: 'Give me creative ideas for ',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: FileText,
      title: 'Write Content',
      subtitle: 'Articles, emails, more',
      prompt: 'Help me write ',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Palette,
      title: 'Create Projects',
      subtitle: 'Design and build',
      prompt: 'Help me create a project about ',
      gradient: 'from-green-500 to-teal-500'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      {actions.map((action, index) => {
        const Icon = action.icon
        
        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onActionClick(action.prompt)}
            className={cn(
              "rounded-2xl p-4 border transition-all text-left group relative overflow-hidden",
              actualTheme === 'dark'
                ? "glass-strong border-white/20 hover:border-white/40 hover:bg-white/10"
                : "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white/95"
            )}
          >
            {/* Gradient Background on Hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
              `bg-gradient-to-br ${action.gradient}`
            )} />
            
            {/* Content */}
            <div className="relative flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                `bg-gradient-to-br ${action.gradient}`
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold mb-1 group-hover:text-primary transition-colors",
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {action.title}
                </h3>
                <p className={cn(
                  "text-sm",
                  actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
                )}>
                  {action.subtitle}
                </p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
