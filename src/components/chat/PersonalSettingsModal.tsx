import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Bot, Loader2, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { usePersonaStore, Persona } from '@/store/personaStore'
import toast from 'react-hot-toast'

interface PersonalSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

export default function PersonalSettingsModal({ isOpen, onClose }: PersonalSettingsModalProps) {
  const { actualTheme } = useThemeStore()
  const { currentPersona, updatePersona, fetchDefaultPersona } = usePersonaStore()
  
  const [aiName, setAiName] = useState('')
  const [userName, setUserName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Initialize form with current persona data
  useEffect(() => {
    if (currentPersona) {
      setAiName(currentPersona.ai_name || '')
      setUserName(currentPersona.user_display_name || 'Friend')
      
      // Load avatar if exists
      if (currentPersona.avatar_url) {
        setAvatarPreview(`${BACKEND_URL}${currentPersona.avatar_url}`)
      } else {
        setAvatarPreview(null)
      }
    }
  }, [currentPersona])
  
  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PNG, JPG, atau WEBP')
      return
    }
    
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 2MB')
      return
    }
    
    setAvatarFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !currentPersona) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      
      const response = await fetch(
        `${BACKEND_URL}/api/personas/${currentPersona.id}/avatar`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Avatar berhasil diupload!')
        setAvatarFile(null)
        await fetchDefaultPersona()
      } else {
        toast.error('Gagal upload avatar')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Gagal upload avatar')
    } finally {
      setUploading(false)
    }
  }
  
  // Delete avatar
  const handleAvatarDelete = async () => {
    if (!currentPersona) return
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/personas/${currentPersona.id}/avatar`,
        {
          method: 'DELETE'
        }
      )
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Avatar dihapus')
        setAvatarPreview(null)
        setAvatarFile(null)
        await fetchDefaultPersona()
      } else {
        toast.error('Gagal hapus avatar')
      }
    } catch (error) {
      console.error('Avatar delete error:', error)
      toast.error('Gagal hapus avatar')
    }
  }
  
  // Save settings
  const handleSave = async () => {
    if (!currentPersona) return
    
    setSaving(true)
    
    try {
      // Upload avatar if selected
      if (avatarFile) {
        await handleAvatarUpload()
      }
      
      // Update persona names
      const updates: Partial<Persona> = {}
      
      if (aiName !== currentPersona.ai_name) {
        updates.ai_name = aiName
      }
      
      if (userName !== currentPersona.user_display_name) {
        updates.user_display_name = userName
      }
      
      if (Object.keys(updates).length > 0) {
        const success = await updatePersona(currentPersona.id, updates)
        
        if (success) {
          await fetchDefaultPersona()
          toast.success('✅ Pengaturan berhasil disimpan!')
          onClose()
        }
      } else if (!avatarFile) {
        toast.success('✅ Tidak ada perubahan')
        onClose()
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }
  
  if (!currentPersona) return null
  
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            data-testid="personal-settings-backdrop"
          />
          
          {/* Modal Container - Full screen centering */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl pointer-events-auto",
                actualTheme === 'dark'
                  ? "bg-dark-surface border border-gray-700"
                  : "bg-white border border-gray-200"
              )}
              data-testid="personal-settings-modal"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={cn(
                "text-xl font-bold",
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Pengaturan Pribadi
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  actualTheme === 'dark'
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                )}
                data-testid="close-settings-button"
              >
                <X className={cn(
                  "w-5 h-5",
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-700'
                )} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar Preview */}
                <div className="relative">
                  {avatarPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  
                  {/* Delete button if avatar exists */}
                  {(avatarPreview || currentPersona.avatar_url) && (
                    <button
                      onClick={handleAvatarDelete}
                      className="absolute -bottom-1 -right-1 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Hapus avatar"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                      actualTheme === 'dark'
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    )}
                    data-testid="upload-avatar-button"
                  >
                    <Upload className="w-4 h-4" />
                    {avatarFile ? 'Ganti Foto' : 'Upload Avatar'}
                  </button>
                  
                  {avatarFile && (
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploading}
                      className="px-4 py-2 rounded-lg font-medium bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {uploading ? 'Uploading...' : 'Simpan'}
                    </button>
                  )}
                </div>
                
                <p className={cn(
                  "text-xs text-center",
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  PNG, JPG, WEBP (max 2MB)
                </p>
              </div>
              
              {/* AI Name Input */}
              <div className="space-y-2">
                <label className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  <Bot className="w-4 h-4" />
                  Nama AI (Persona)
                </label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="Salma, Polar, dll"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    actualTheme === 'dark'
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  )}
                  data-testid="ai-name-input"
                />
                <p className={cn(
                  "text-xs",
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Nama yang akan ditampilkan sebagai AI/Agent
                </p>
              </div>
              
              {/* User Display Name Input */}
              <div className="space-y-2">
                <label className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  <User className="w-4 h-4" />
                  Nama Panggilan Anda
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Lycus, Affif, dll"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    actualTheme === 'dark'
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  )}
                  data-testid="user-name-input"
                />
                <p className={cn(
                  "text-xs",
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Nama yang akan digunakan {currentPersona.name} untuk memanggil Anda
                </p>
              </div>
              
              {/* Example Preview */}
              <div className={cn(
                "p-4 rounded-lg border-l-4 border-primary",
                actualTheme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
              )}>
                <p className={cn(
                  "text-sm font-medium mb-2",
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Preview Chat:
                </p>
                <div className="space-y-2 text-sm">
                  <p className={cn(
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <span className="font-semibold">{userName || 'Friend'}</span>: Halo!
                  </p>
                  <p className={cn(
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <span className="font-semibold">{aiName || currentPersona.name}</span>: Hai {userName || 'Friend'}, ada yang bisa saya bantu?
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg font-medium transition-colors",
                  actualTheme === 'dark'
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                )}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-settings-button"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
