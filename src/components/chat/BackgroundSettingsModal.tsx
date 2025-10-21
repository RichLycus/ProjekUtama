import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, RefreshCw, Check, Image as ImageIcon } from 'lucide-react'
import { useBackgroundStore, defaultBackgrounds } from '@/store/backgroundStore'
import toast from 'react-hot-toast'

interface BackgroundSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BackgroundSettingsModal({ isOpen, onClose }: BackgroundSettingsModalProps) {
  const { backgroundType, backgroundValue, setBackground, setCustomImage, resetBackground } = useBackgroundStore()
  const [activeTab, setActiveTab] = useState<'gradients' | 'colors' | 'custom'>('gradients')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Format tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setCustomImage(imageUrl)
      toast.success('Background berhasil diupload!')
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    resetBackground()
    toast.success('Background direset ke default')
  }

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="glass-strong rounded-2xl border border-gray-200 dark:border-dark-border max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
                <div>
                  <h2 className="text-xl font-bold text-text dark:text-white">Customize Background</h2>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                    Personalize your chat experience
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-dark-border">
                <button
                  onClick={() => setActiveTab('gradients')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'gradients'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-surface-hover text-text dark:text-white'
                  }`}
                >
                  Gradients
                </button>
                <button
                  onClick={() => setActiveTab('colors')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'colors'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-surface-hover text-text dark:text-white'
                  }`}
                >
                  Solid Colors
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'custom'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-surface-hover text-text dark:text-white'
                  }`}
                >
                  Custom Image
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* Gradients Tab */}
                {activeTab === 'gradients' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {defaultBackgrounds.gradients.map((gradient, index) => (
                      <button
                        key={index}
                        onClick={() => setBackground('gradient', gradient)}
                        className="relative group aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          backgroundType === 'gradient' && backgroundValue === gradient
                            ? 'border-primary shadow-lg'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }"
                        style={{ background: gradient }}
                      >
                        {backgroundType === 'gradient' && backgroundValue === gradient && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {defaultBackgrounds.colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setBackground('color', color)}
                        className="relative group aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          backgroundType === 'color' && backgroundValue === color
                            ? 'border-primary shadow-lg'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }"
                        style={{ backgroundColor: color }}
                      >
                        {backgroundType === 'color' && backgroundValue === color && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-1.5">
                              <Check className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Image Tab */}
                {activeTab === 'custom' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-text dark:text-white mb-1">
                        Upload Background Image
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        JPG, PNG, GIF up to 5MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {backgroundType === 'image' && backgroundValue && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-text dark:text-white flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Current Background
                        </p>
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary">
                          <img
                            src={backgroundValue}
                            alt="Custom background"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-border">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-surface-hover rounded-lg transition-colors font-medium text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset to Default
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors font-medium shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
