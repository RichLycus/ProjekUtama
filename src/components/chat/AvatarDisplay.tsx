import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarDisplayProps {
  isThinking?: boolean
}

export default function AvatarDisplay({ isThinking = false }: AvatarDisplayProps) {
  return (
    <div className="glass-strong rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
      {/* Avatar placeholder */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isThinking ? Infinity : 0,
          ease: 'easeInOut'
        }}
        className="relative"
      >
        {/* Glow effect */}
        {isThinking && (
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl"
          />
        )}
        
        {/* Avatar circle */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
        </div>
      </motion.div>
      
      {/* Info */}
      <div className="mt-4 sm:mt-6 text-center">
        <h3 className="text-base sm:text-lg font-bold text-text dark:text-white mb-1">
          Lycus AI
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400">
          {isThinking ? 'Berpikir...' : 'Siap membantu'}
        </p>
      </div>
      
      {/* Status indicator */}
      <div className="mt-3 sm:mt-4 flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isThinking ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
        )} />
        <span className="text-xs text-text-muted dark:text-gray-500">
          {isThinking ? 'Processing' : 'Online'}
        </span>
      </div>
      
      {/* 3D Avatar placeholder */}
      <div className="mt-4 sm:mt-6 text-xs text-text-muted dark:text-gray-500 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        <span>3D Avatar - Coming Soon</span>
      </div>
    </div>
  )
}
