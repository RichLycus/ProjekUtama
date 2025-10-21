import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BackgroundState {
  backgroundType: 'default' | 'gradient' | 'color' | 'image'
  backgroundValue: string
  customImage: string | null
  setBackground: (type: BackgroundState['backgroundType'], value: string) => void
  setCustomImage: (image: string) => void
  resetBackground: () => void
}

const defaultBackgrounds = {
  default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradients: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ],
  colors: [
    '#1a1a2e',
    '#0f0f0f',
    '#16213e',
    '#1e1e1e',
    '#2d3436',
  ]
}

export const useBackgroundStore = create<BackgroundState>()(persist(
  (set) => ({
    backgroundType: 'default',
    backgroundValue: defaultBackgrounds.default,
    customImage: null,
    
    setBackground: (type, value) => set({ 
      backgroundType: type, 
      backgroundValue: value,
      customImage: type === 'image' ? value : null
    }),
    
    setCustomImage: (image) => set({ 
      backgroundType: 'image',
      backgroundValue: image,
      customImage: image 
    }),
    
    resetBackground: () => set({
      backgroundType: 'default',
      backgroundValue: defaultBackgrounds.default,
      customImage: null
    })
  }),
  {
    name: 'chat-background-storage'
  }
))

export { defaultBackgrounds }
