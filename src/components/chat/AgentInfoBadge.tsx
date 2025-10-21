import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

interface AgentConfig {
  id: string
  agent_type: string
  model_name: string
  display_name: string
  description: string
  is_enabled: number
  temperature: number
  max_tokens: number
}

export default function AgentInfoBadge() {
  const { actualTheme } = useThemeStore()
  const [configs, setConfigs] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch agent configs on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/api/agents/configs`)
        if (response.data.success) {
          // Get enabled configs
          const enabledConfigs = response.data.configs.filter(
            (config: AgentConfig) => config.is_enabled === 1
          )
          setConfigs(enabledConfigs)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch agent configs:', err)
        setError('Failed to load agent info')
        setLoading(false)
      }
    }

    fetchConfigs()
  }, [])

  // Get primary agent (first enabled or default to first)
  const primaryAgent = configs.length > 0 ? configs[0] : null

  // Don't render anything if loading or error
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "rounded-xl px-4 py-2 border flex items-center gap-2",
          actualTheme === 'dark'
            ? "glass-strong border-white/20"
            : "bg-white/80 border-gray-200"
        )}
      >
        <Loader2 className={cn(
          "w-4 h-4 animate-spin",
          actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
        )} />
        <span className={cn(
          "text-sm",
          actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
        )}>
          Loading...
        </span>
      </motion.div>
    )
  }

  if (error || !primaryAgent) {
    return null
  }

  // Status indicator based on enabled state
  const statusColor = primaryAgent.is_enabled === 1 ? 'bg-green-400' : 'bg-yellow-400'
  const statusText = primaryAgent.is_enabled === 1 ? 'Active' : 'Standby'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-xl px-4 py-2.5 border transition-all hover:scale-[1.02] cursor-default",
        actualTheme === 'dark'
          ? "glass-strong border-white/20 hover:border-white/30"
          : "bg-white/90 border-gray-200 hover:border-gray-300 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Agent Icon */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            actualTheme === 'dark'
              ? "bg-gradient-to-br from-primary via-secondary to-purple-600"
              : "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          )}>
            <Cpu className="w-4 h-4 text-white" />
          </div>
          
          {/* Status indicator with animation */}
          <div className="absolute -bottom-0.5 -right-0.5">
            <div className={cn(
              "w-3 h-3 rounded-full border-2",
              actualTheme === 'dark' ? 'border-gray-800' : 'border-white',
              statusColor
            )}>
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-75",
                statusColor
              )} />
            </div>
          </div>
        </div>
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm font-semibold truncate",
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {primaryAgent.display_name}
            </p>
            {primaryAgent.is_enabled === 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <p className={cn(
            "text-xs truncate",
            actualTheme === 'dark' ? 'text-white/60' : 'text-gray-600'
          )}>
            {primaryAgent.model_name} • {statusText}
          </p>
        </div>
        
        {/* Configs count badge (if multiple) */}
        {configs.length > 1 && (
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            actualTheme === 'dark'
              ? "bg-white/10 text-white/70"
              : "bg-gray-100 text-gray-700"
          )}>
            +{configs.length - 1}
          </div>
        )}
      </div>
      
      {/* Description tooltip on hover (optional) */}
      {primaryAgent.description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          whileHover={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <p className={cn(
            "text-xs mt-2 pt-2 border-t",
            actualTheme === 'dark' 
              ? 'text-white/50 border-white/10' 
              : 'text-gray-500 border-gray-200'
          )}>
            {primaryAgent.description}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
