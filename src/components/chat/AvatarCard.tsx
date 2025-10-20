import { motion } from 'framer-motion'
import { Bot, Zap, Video } from 'lucide-react'

interface AvatarCardProps {
  collapsed?: boolean
  personaName?: string
}

export default function AvatarCard({ collapsed = false, personaName = 'Lycus AI' }: AvatarCardProps) {
  if (collapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3"
      >
        <div className="relative group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-background">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
              {personaName}
              <div className="text-green-400 text-[10px]">● Online</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3"
    >
      <div className="glass-strong rounded-2xl p-4 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-all duration-300">
        {/* Avatar with gradient background */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            {/* Online indicator with pulse animation */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-background">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-text dark:text-white truncate">
              {personaName}
            </h3>
            <p className="text-xs text-text-secondary dark:text-gray-400">
              Siap membantu
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Online
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-primary">
            <Zap className="w-3.5 h-3.5" />
            <span className="font-medium">Ready</span>
          </div>
        </div>

        {/* 3D Avatar Feature - Coming Soon */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 to-primary/10 dark:from-purple-500/20 dark:to-primary/20 p-3 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text dark:text-white">
                3D Avatar - Coming Soon
              </p>
              <p className="text-[10px] text-text-muted dark:text-gray-500">
                Lipsync Animation Ready
              </p>
            </div>
          </div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </motion.div>
  )
}
