import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface TypewriterTextProps {
  text: string
  speed?: number // milliseconds per character
  onComplete?: () => void
  className?: string
  cursorColor?: string
}

export default function TypewriterText({ 
  text, 
  speed = 50, // Dramatic speed: 50ms per character
  onComplete,
  className = "",
  cursorColor = "text-primary"
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      // Calculate delay - add extra pause for punctuation
      const char = text[currentIndex]
      let delay = speed
      
      // Dramatic pauses for punctuation
      if (char === '.' || char === '!' || char === '?') {
        delay = speed * 8 // Longer pause after sentences
      } else if (char === ',' || char === ';' || char === ':') {
        delay = speed * 4 // Medium pause for commas
      } else if (char === '\n') {
        delay = speed * 6 // Pause for new lines
      }

      timeoutRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + char)
        setCurrentIndex(prev => prev + 1)
      }, delay)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    } else if (!isComplete && currentIndex === text.length) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete])

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          className={`inline-block w-0.5 h-4 ml-0.5 ${cursorColor} bg-current`}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </span>
  )
}
