import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCircle, Heart, Users, Briefcase, Home, UserPlus } from 'lucide-react'
import { usePersonaStore } from '../../store/personaStore'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../lib/utils'

interface CharacterSelectorProps {
  isOpen: boolean
  onClose: () => void
}

const RELATIONSHIP_ICONS: Record<string, any> = {
  'Kekasih': Heart,
  'Sahabat': Users,
  'Teman': UserCircle,
  'Partner Kerja': Briefcase,
  'Keluarga': Home
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  'Kekasih': 'text-pink-500',
  'Sahabat': 'text-blue-500',
  'Teman': 'text-green-500',
  'Partner Kerja': 'text-purple-500',
  'Keluarga': 'text-orange-500'
}

export default function CharacterSelector({ isOpen, onClose }: CharacterSelectorProps) {
  const { actualTheme } = useThemeStore()
  const { 
    characters, 
    activeCharacter, 
    activeRelationship,
    currentPersona,
    fetchCharacters, 
    setActiveCharacter,
    clearActiveCharacter
  } = usePersonaStore()
  
  const [characterRelationships, setCharacterRelationships] = useState<Record<string, any>>({})

  // Load characters and their relationships when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCharacters()
      loadCharacterRelationships()
    }
  }, [isOpen, currentPersona])

  const loadCharacterRelationships = async () => {
    if (!currentPersona) return
    
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/${currentPersona.id}/relationships`)
      const data = await response.json()
      
      if (data.success) {
        // Create a map of character_id -> relationship
        const relMap: Record<string, any> = {}
        data.relationships.forEach((rel: any) => {
          relMap[rel.user_character_id] = rel
        })
        setCharacterRelationships(relMap)
      }
    } catch (error) {
      console.error('Failed to load relationships:', error)
    }
  }

  const handleSelectCharacter = (character: any) => {
    setActiveCharacter(character)
    onClose()
  }

  const handleClearCharacter = () => {
    clearActiveCharacter()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-lg rounded-2xl shadow-2xl",
            actualTheme === 'dark'
              ? "bg-dark-surface border border-gray-700"
              : "bg-white border border-gray-200"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          )}>
            <div>
              <h2 className={cn(
                "text-2xl font-bold",
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Pilih Karakter
              </h2>
              <p className={cn(
                "text-sm mt-1",
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Chat sebagai karakter dengan relasi persona
              </p>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors",
                actualTheme === 'dark'
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Current Selection */}
            {activeCharacter && (
              <div className={cn(
                "mb-4 p-4 rounded-xl border-2",
                actualTheme === 'dark'
                  ? "bg-dark-background border-purple-500/50"
                  : "bg-purple-50 border-purple-200"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      actualTheme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-200'
                    )}>
                      <UserCircle className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold",
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {activeCharacter.name}
                      </p>
                      {activeRelationship && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            actualTheme === 'dark'
                              ? 'bg-purple-900/50 text-purple-300'
                              : 'bg-purple-100 text-purple-700'
                          )}>
                            {activeRelationship.relationship_type}
                          </span>
                          <span className={cn(
                            "text-xs",
                            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Dipanggil: {activeRelationship.primary_nickname}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleClearCharacter}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                      actualTheme === 'dark'
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    )}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Character List */}
            <div className="space-y-2">
              {characters.length === 0 ? (
                <div className={cn(
                  "text-center py-12",
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Belum ada karakter</p>
                  <p className="text-sm mt-1">
                    Buat karakter di Persona Manager dulu
                  </p>
                </div>
              ) : (
                characters.map((character) => {
                  const relationship = characterRelationships[character.id]
                  const RelationIcon = relationship 
                    ? RELATIONSHIP_ICONS[relationship.relationship_type] || UserCircle
                    : UserCircle
                  const relationColor = relationship
                    ? RELATIONSHIP_COLORS[relationship.relationship_type] || 'text-gray-500'
                    : 'text-gray-500'
                  const isActive = activeCharacter?.id === character.id

                  return (
                    <motion.button
                      key={character.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCharacter(character)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all text-left",
                        isActive
                          ? actualTheme === 'dark'
                            ? "bg-purple-900/30 border-purple-500"
                            : "bg-purple-50 border-purple-300"
                          : actualTheme === 'dark'
                            ? "bg-dark-background border-gray-700 hover:border-gray-600"
                            : "bg-white border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                          isActive
                            ? actualTheme === 'dark'
                              ? 'bg-purple-900/50'
                              : 'bg-purple-200'
                            : actualTheme === 'dark'
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                        )}>
                          <RelationIcon className={cn(
                            "w-6 h-6",
                            isActive ? 'text-purple-500' : relationColor
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-semibold text-lg",
                            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {character.name}
                          </h3>

                          {character.bio && (
                            <p className={cn(
                              "text-sm mt-1 line-clamp-2",
                              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {character.bio}
                            </p>
                          )}

                          {relationship ? (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                actualTheme === 'dark'
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                              )}>
                                {relationship.relationship_type}
                              </span>
                              <span className={cn(
                                "text-xs",
                                actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                              )}>
                                •
                              </span>
                              <span className={cn(
                                "text-xs",
                                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                Dipanggil "{relationship.primary_nickname}"
                              </span>
                            </div>
                          ) : (
                            <p className={cn(
                              "text-xs mt-2",
                              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            )}>
                              Tidak ada relasi dengan {currentPersona?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            "p-6 border-t",
            actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          )}>
            <p className={cn(
              "text-xs text-center",
              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            )}>
              Persona akan menggunakan nickname & preferensi karakter dalam percakapan
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
