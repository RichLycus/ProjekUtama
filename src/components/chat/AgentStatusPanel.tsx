import { motion } from 'framer-motion'
import { Activity, Database, Cog, Brain, Sparkles } from 'lucide-react'

interface AgentStatus {
  name: string
  status: 'idle' | 'active' | 'ready'
  icon: any
  color: string
}

interface AgentStatusPanelProps {
  loading?: boolean
}

export default function AgentStatusPanel({ loading = false }: AgentStatusPanelProps) {
  const agents: AgentStatus[] = [
    { 
      name: 'Router', 
      status: loading ? 'active' : 'ready',
      icon: Activity,
      color: 'text-blue-500'
    },
    { 
      name: 'RAG', 
      status: loading ? 'active' : 'ready',
      icon: Database,
      color: 'text-green-500'
    },
    { 
      name: 'Execution', 
      status: 'ready',
      icon: Cog,
      color: 'text-orange-500'
    },
    { 
      name: 'Reasoning', 
      status: loading ? 'active' : 'ready',
      icon: Brain,
      color: 'text-purple-500'
    },
    { 
      name: 'Persona', 
      status: loading ? 'active' : 'ready',
      icon: Sparkles,
      color: 'text-pink-500'
    }
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'ready':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }
  
  return (
    <div className="glass-strong rounded-2xl p-4">
      <h3 className="text-sm font-bold text-text dark:text-white mb-4">
        Agent Status
      </h3>
      
      <div className="space-y-3">
        {agents.map((agent, index) => {
          const Icon = agent.icon
          const isActive = agent.status === 'active'
          
          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* Status indicator */}
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: isActive ? Infinity : 0,
                }}
                className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} ${isActive ? 'animate-pulse' : ''}`}
              />
              
              {/* Icon */}
              <div className={`${agent.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              {/* Name */}
              <span className="text-xs text-text-secondary dark:text-gray-400 flex-1">
                {agent.name}
              </span>
              
              {/* Status text */}
              <span className="text-xs text-text-muted dark:text-gray-500 capitalize">
                {agent.status}
              </span>
            </motion.div>
          )
        })}
      </div>
      
      {/* Overall status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary dark:text-gray-400">
            System Status
          </span>
          <span className={`font-medium ${loading ? 'text-yellow-500' : 'text-green-500'}`}>
            {loading ? 'Processing' : 'Operational'}
          </span>
        </div>
      </div>
    </div>
  )
}
