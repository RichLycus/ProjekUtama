import { useEffect, useRef } from 'react'

interface AnimatedAvatarProps {
  size?: number
  isActive?: boolean
}

export default function AnimatedAvatar({ size = 200, isActive = false }: AnimatedAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    let frame = 0
    const centerX = size / 2
    const centerY = size / 2
    const baseRadius = size * 0.25

    // Wave particles configuration
    const particleCount = 80
    const particles: Array<{
      angle: number
      distance: number
      speed: number
      size: number
      opacity: number
    }> = []

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / particleCount,
        distance: baseRadius + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
      })
    }

    const animate = () => {
      frame++
      ctx.clearRect(0, 0, size, size)

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2.5)
      glowGradient.addColorStop(0, 'rgba(0, 122, 204, 0.1)')
      glowGradient.addColorStop(0.5, 'rgba(0, 152, 255, 0.05)')
      glowGradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)

      // Animated core globe
      const pulseScale = 1 + Math.sin(frame * 0.02) * 0.1
      const coreRadius = baseRadius * pulseScale

      // Core gradient
      const coreGradient = ctx.createRadialGradient(
        centerX - coreRadius * 0.3,
        centerY - coreRadius * 0.3,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius
      )
      coreGradient.addColorStop(0, 'rgba(0, 212, 255, 0.9)')
      coreGradient.addColorStop(0.4, 'rgba(0, 152, 255, 0.7)')
      coreGradient.addColorStop(1, 'rgba(0, 122, 204, 0.5)')

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw wave particles (Gemini-style)
      particles.forEach((particle, i) => {
        // Update particle position
        particle.angle += particle.speed * 0.01
        
        // Wave effect
        const wave = Math.sin(frame * 0.05 + i * 0.1) * 10
        const currentDistance = particle.distance + wave
        
        // Calculate position
        const x = centerX + Math.cos(particle.angle) * currentDistance
        const y = centerY + Math.sin(particle.angle) * currentDistance

        // Dynamic opacity based on wave
        const dynamicOpacity = particle.opacity * (0.5 + Math.abs(Math.sin(frame * 0.05 + i * 0.1)) * 0.5)

        // Color gradient for particles
        const hue = (frame * 0.5 + i * 3) % 60 + 180 // Cycle between blue shades
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${dynamicOpacity})`
        
        ctx.beginPath()
        ctx.arc(x, y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Connection lines between nearby particles
        if (i % 3 === 0) {
          const nextParticle = particles[(i + 1) % particleCount]
          const nextX = centerX + Math.cos(nextParticle.angle) * (nextParticle.distance + Math.sin(frame * 0.05 + (i + 1) * 0.1) * 10)
          const nextY = centerY + Math.sin(nextParticle.angle) * (nextParticle.distance + Math.sin(frame * 0.05 + (i + 1) * 0.1) * 10)
          
          const distance = Math.sqrt((nextX - x) ** 2 + (nextY - y) ** 2)
          if (distance < 40) {
            ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${dynamicOpacity * 0.3})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(nextX, nextY)
            ctx.stroke()
          }
        }
      })

      // Rotating rings around globe
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const ringRadius = baseRadius * (1.3 + i * 0.3)
        const ringOpacity = 0.3 - i * 0.1
        const rotation = frame * 0.01 * (i % 2 === 0 ? 1 : -1)

        ctx.strokeStyle = `rgba(0, 152, 255, ${ringOpacity})`
        ctx.lineWidth = 1
        ctx.setLineDash([5, 10])
        ctx.lineDashOffset = -frame * 0.5

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rotation)
        ctx.beginPath()
        ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // Inner core detail (spinning effect)
      const spinAngle = frame * 0.03
      const detailRadius = baseRadius * 0.5
      
      for (let i = 0; i < 8; i++) {
        const angle = spinAngle + (Math.PI * 2 * i) / 8
        const x1 = centerX + Math.cos(angle) * (detailRadius * 0.5)
        const y1 = centerY + Math.sin(angle) * (detailRadius * 0.5)
        const x2 = centerX + Math.cos(angle) * detailRadius
        const y2 = centerY + Math.sin(angle) * detailRadius

        const lineGradient = ctx.createLinearGradient(x1, y1, x2, y2)
        lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
        lineGradient.addColorStop(1, 'rgba(0, 212, 255, 0)')

        ctx.strokeStyle = lineGradient
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [size, isActive])

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Outer glow effect */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, rgba(0, 122, 204, 0.1) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="relative z-10"
        style={{ width: size, height: size }}
      />
      
      {/* Status indicator */}
      {isActive && (
        <div className="absolute bottom-0 right-0 z-20">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-strong">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-text-secondary font-medium">Active</span>
          </div>
        </div>
      )}
    </div>
  )
}
