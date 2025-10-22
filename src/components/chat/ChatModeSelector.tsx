import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, X } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../lib/utils'

interface ChatModeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: 'flash' | 'pro') => void
  currentMode?: 'flash' | 'pro'
}

export default function ChatModeSelector({ 
  isOpen, 
  onClose, 
  onSelectMode,
  currentMode = 'flash' 
}: ChatModeSelectorProps) {
  const { actualTheme } = useThemeStore()
  
  const modes = [
    {
      id: 'flash' as const,
      icon: Zap,
      title: 'Flash Mode',
      subtitle: '⚡ Fast & Simple',
      description: 'Quick responses for everyday conversations. Perfect for fast interactions and simple queries.',
      features: ['Instant responses', 'Streamlined UI', 'Efficient processing'],
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'pro' as const,
      icon: Brain,
      title: 'Pro Mode',
      subtitle: '🧠 Deep Thinking',
      description: 'Advanced AI with comprehensive analysis. Ideal for complex tasks and in-depth discussions.',
      features: ['Action cards', 'Advanced features', 'Detailed responses'],
      color: 'from-purple-500 to-pink-500'
    }
  ]
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden",
                actualTheme === 'dark'
                  ? "glass-strong border-white/20"
                  : "bg-white border-gray-200"
              )}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={cn(
                      "text-2xl font-bold mb-1",
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      Choose Chat Mode
                    </h2>
                    <p className={cn(
                      "text-sm",
                      actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    )}>
                      Select the mode that fits your needs
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      actualTheme === 'dark'
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <X className={cn(
                      "w-5 h-5",
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
                    )} />
                  </button>
                </div>
              </div>
              
              {/* Mode Cards */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {modes.map((mode) => {
                  const Icon = mode.icon
                  const isSelected = currentMode === mode.id
                  
                  return (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectMode(mode.id)
                        onClose()
                      }}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                        isSelected
                          ? actualTheme === 'dark'
                            ? "border-primary bg-primary/10"
                            : "border-primary bg-primary/5"
                          : actualTheme === 'dark'
                            ? "border-white/10 hover:border-white/30 bg-white/5"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50"
                      )}
                    >
                      {/* Background Gradient */}
                      <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
                        `bg-gradient-to-br ${mode.color}`
                      )} />
                      
                      {/* Content */}
                      <div className="relative">
                        {/* Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl mb-4 flex items-center justify-center",
                          `bg-gradient-to-br ${mode.color}`
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Title */}
                        <h3 className={cn(
                          "text-xl font-bold mb-1",
                          actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {mode.title}
                        </h3>
                        
                        {/* Subtitle */}
                        <p className={cn(
                          "text-sm mb-3",
                          actualTheme === 'dark' ? 'text-white/80' : 'text-gray-700'
                        )}>
                          {mode.subtitle}
                        </p>
                        
                        {/* Description */}
                        <p className={cn(
                          "text-sm mb-4",
                          actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
                        )}>
                          {mode.description}
                        </p>
                        
                        {/* Features */}
                        <ul className="space-y-2">
                          {mode.features.map((feature, index) => (
                            <li 
                              key={index}
                              className={cn(
                                "flex items-center gap-2 text-sm",
                                actualTheme === 'dark' ? 'text-white/70' : 'text-gray-700'
                              )}
                            >
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? 'bg-primary' : actualTheme === 'dark' ? 'bg-white/40' : 'bg-gray-400'
                              )} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {/* Selected Badge */}
                        {isSelected && (
                          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Currently selected
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
