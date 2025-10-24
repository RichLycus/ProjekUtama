import * as React from 'react'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  className?: string
}

export function Slider({ value, onValueChange, min, max, step, className = '' }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)])
  }

  return (
    <input
      type="range"
      value={value[0]}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 ${className}`}
      style={{
        background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((value[0] - min) / (max - min)) * 100}%, rgb(229, 231, 235) ${((value[0] - min) / (max - min)) * 100}%, rgb(229, 231, 235) 100%)`
      }}
    />
  )
}
