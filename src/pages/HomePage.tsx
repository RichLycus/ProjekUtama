import { useEffect, useState } from 'react'
import AnimatedAvatar from '@/components/AnimatedAvatar'

export default function HomePage() {
  const [pingResult, setPingResult] = useState<string>('')

  useEffect(() => {
    // Test Electron IPC
    if (window.electronAPI) {
      window.electronAPI.ping().then((result) => {
        setPingResult(result)
        console.log('IPC Test:', result)
      })
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-88px)] flex flex-col items-center justify-center px-6 py-8">
      {/* Avatar Area */}
      <div className="relative mb-8">
        <AnimatedAvatar size={240} isActive={!!pingResult} />
      </div>

      {/* Title */}
      <h1 className="text-5xl font-display font-bold text-text mb-4">
        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">ChimeraAI</span>
      </h1>
      
      <p className="text-xl text-text-secondary mb-8 text-center max-w-2xl">
        Your intelligent desktop companion for automation, creativity, and productivity
      </p>

      {/* IPC Status */}
      {pingResult && (
        <div className="card flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-text-secondary">
            Electron IPC: <span className="text-green-500 font-medium">{pingResult}</span>
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <QuickActionCard
          title="Python Tools"
          description="Execute powerful automation scripts"
          icon="🛠️"
          comingSoon
        />
        <QuickActionCard
          title="AI Chat"
          description="Interact with local AI models"
          icon="💬"
          comingSoon
        />
        <QuickActionCard
          title="Web Games"
          description="Enjoy embedded entertainment"
          icon="🎮"
          comingSoon
        />
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: string
  comingSoon?: boolean
}

function QuickActionCard({ title, description, icon, comingSoon }: QuickActionCardProps) {
  return (
    <div className="card group cursor-pointer hover:scale-105 transition-transform">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
      {comingSoon && (
        <span className="mt-4 inline-block px-3 py-1 text-xs bg-primary/20 text-primary rounded-full">
          Phase {title.includes('Python') ? '2' : title.includes('AI') ? '3' : '5'}
        </span>
      )}
    </div>
  )
}