import { useState, useEffect } from 'react'
import { usePersonaStore, Persona } from '@/store/personaStore'
import { Users, Plus, Edit2, Trash2, Star, X, Sparkles, UserCircle, Heart, Link } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

// Types for user characters
interface UserCharacter {
  id: string
  name: string
  bio: string
  preferences: {
    hobi?: string[]
    kesukaan?: {
      warna?: string
      makanan?: string
      [key: string]: any
    }
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

interface PersonaRelationship {
  id: string
  persona_id: string
  user_character_id: string
  relationship_type: string
  primary_nickname: string
  alternate_nicknames: string[]
  notes: string
  character_name?: string
  character_bio?: string
  persona_name?: string
  persona_ai_name?: string
}

export default function PersonaManager() {
  const { personas, fetchPersonas, createPersona, updatePersona, deletePersona, setDefaultPersona, loading } = usePersonaStore()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'personas' | 'characters'>('personas')
  
  // Persona form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Character state
  const [characters, setCharacters] = useState<UserCharacter[]>([])
  const [showCharacterForm, setShowCharacterForm] = useState(false)
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  
  // Relationship state
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [personaRelationships, setPersonaRelationships] = useState<Record<string, PersonaRelationship[]>>({})
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null)
  
  // Character form data
  const [characterFormData, setCharacterFormData] = useState({
    name: '',
    bio: '',
    preferences: {
      hobi: [] as string[],
      kesukaan: {
        warna: '',
        makanan: ''
      }
    }
  })
  const [formData, setFormData] = useState({
    name: '',
    ai_name: '',
    ai_nickname: '',
    user_greeting: '',
    personality_traits: {
      technical: 50,
      friendly: 50,
      direct: 50,
      creative: 50,
      professional: 50
    },
    response_style: 'balanced',
    tone: 'friendly',
    sample_greeting: '',
    avatar_color: 'purple'
  })

  // Relationship form data
  const [relationshipFormData, setRelationshipFormData] = useState({
    persona_id: '',
    user_character_id: '',
    relationship_type: 'Teman',
    primary_nickname: '',
    alternate_nicknames: [''],
    notes: ''
  })

  useEffect(() => {
    fetchPersonas()
    if (activeTab === 'characters') {
      fetchCharacters()
    }
  }, [activeTab])
  
  // Fetch user characters
  const fetchCharacters = async () => {
    setLoadingCharacters(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/characters/all`)
      const data = await response.json()
      if (data.success) {
        setCharacters(data.characters)
        
        // Fetch relationships for each character
        for (const char of data.characters) {
          fetchCharacterRelationships(char.id)
        }
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
      toast.error('Gagal memuat karakter')
    } finally {
      setLoadingCharacters(false)
    }
  }
  
  // Fetch relationships for a persona
  const fetchPersonaRelationships = async (personaId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/${personaId}/relationships`)
      const data = await response.json()
      if (data.success) {
        setPersonaRelationships(prev => ({
          ...prev,
          [personaId]: data.relationships
        }))
      }
    } catch (error) {
      console.error('Error fetching persona relationships:', error)
    }
  }
  
  // Fetch relationships for a character
  const fetchCharacterRelationships = async (characterId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/characters/${characterId}/relationships`)
      const data = await response.json()
      if (data.success) {
        // Store in persona relationships map by character
        setPersonaRelationships(prev => ({
          ...prev,
          [`char_${characterId}`]: data.relationships
        }))
      }
    } catch (error) {
      console.error('Error fetching character relationships:', error)
    }
  }
  
  // Create character
  const handleCreateCharacter = async () => {
    if (!characterFormData.name) {
      toast.error('Nama karakter harus diisi')
      return
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterFormData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Karakter berhasil dibuat!')
        setShowCharacterForm(false)
        resetCharacterForm()
        fetchCharacters()
      } else {
        toast.error('Gagal membuat karakter')
      }
    } catch (error) {
      console.error('Error creating character:', error)
      toast.error('Gagal membuat karakter')
    }
  }
  
  // Update character
  const handleUpdateCharacter = async () => {
    if (!editingCharacterId) return
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/characters/${editingCharacterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterFormData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Karakter berhasil diupdate!')
        setShowCharacterForm(false)
        setEditingCharacterId(null)
        resetCharacterForm()
        fetchCharacters()
      } else {
        toast.error('Gagal update karakter')
      }
    } catch (error) {
      console.error('Error updating character:', error)
      toast.error('Gagal update karakter')
    }
  }
  
  // Delete character
  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm('Yakin ingin menghapus karakter ini?')) return
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/characters/${characterId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Karakter dihapus')
        fetchCharacters()
      } else {
        toast.error('Gagal menghapus karakter')
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      toast.error('Gagal menghapus karakter')
    }
  }
  
  // Create relationship
  const handleCreateRelationship = async () => {
    if (!relationshipFormData.persona_id || !relationshipFormData.user_character_id || !relationshipFormData.primary_nickname) {
      toast.error('Semua field harus diisi')
      return
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...relationshipFormData,
          alternate_nicknames: relationshipFormData.alternate_nicknames.filter(n => n.trim() !== '')
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Relasi berhasil dibuat!')
        setShowRelationshipForm(false)
        resetRelationshipForm()
        fetchPersonaRelationships(relationshipFormData.persona_id)
        fetchCharacters() // Refresh to update relationship counts
      } else {
        toast.error(data.detail || 'Gagal membuat relasi')
      }
    } catch (error) {
      console.error('Error creating relationship:', error)
      toast.error('Gagal membuat relasi')
    }
  }
  
  // Update relationship
  const handleUpdateRelationship = async () => {
    if (!editingRelationshipId || !relationshipFormData.primary_nickname) {
      toast.error('Semua field harus diisi')
      return
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/relationships/${editingRelationshipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_type: relationshipFormData.relationship_type,
          primary_nickname: relationshipFormData.primary_nickname,
          alternate_nicknames: relationshipFormData.alternate_nicknames.filter(n => n.trim() !== ''),
          notes: relationshipFormData.notes
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Relasi berhasil diupdate!')
        setShowRelationshipForm(false)
        setEditingRelationshipId(null)
        resetRelationshipForm()
        fetchPersonaRelationships(relationshipFormData.persona_id)
        fetchCharacters()
      } else {
        toast.error(data.detail || 'Gagal update relasi')
      }
    } catch (error) {
      console.error('Error updating relationship:', error)
      toast.error('Gagal update relasi')
    }
  }
  
  // Delete relationship
  const handleDeleteRelationship = async (relationshipId: string, personaId: string) => {
    if (!confirm('Yakin ingin menghapus relasi ini?')) return
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/personas/relationships/${relationshipId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ Relasi dihapus')
        fetchPersonaRelationships(personaId)
      } else {
        toast.error('Gagal menghapus relasi')
      }
    } catch (error) {
      console.error('Error deleting relationship:', error)
      toast.error('Gagal menghapus relasi')
    }
  }
  
  // Handle edit relationship
  const handleStartEditRelationship = (relationship: PersonaRelationship, personaId: string) => {
    setEditingRelationshipId(relationship.id)
    setRelationshipFormData({
      persona_id: personaId,
      user_character_id: relationship.user_character_id,
      relationship_type: relationship.relationship_type,
      primary_nickname: relationship.primary_nickname,
      alternate_nicknames: relationship.alternate_nicknames.length > 0 ? relationship.alternate_nicknames : [''],
      notes: relationship.notes || ''
    })
    setShowRelationshipForm(true)
  }
  
  // Reset forms
  const resetCharacterForm = () => {
    setCharacterFormData({
      name: '',
      bio: '',
      preferences: {
        hobi: [],
        kesukaan: {
          warna: '',
          makanan: ''
        }
      }
    })
  }
  
  const resetRelationshipForm = () => {
    setRelationshipFormData({
      persona_id: '',
      user_character_id: '',
      relationship_type: 'Teman',
      primary_nickname: '',
      alternate_nicknames: [''],
      notes: ''
    })
  }
  
  // Handle edit character
  const handleStartEditCharacter = (character: UserCharacter) => {
    setEditingCharacterId(character.id)
    setCharacterFormData({
      name: character.name,
      bio: character.bio || '',
      preferences: character.preferences || {
        hobi: [],
        kesukaan: { warna: '', makanan: '' }
      }
    })
    setShowCharacterForm(true)
  }
  
  // Handle add relationship from persona
  const handleAddRelationshipToPersona = (personaId: string) => {
    setRelationshipFormData({
      ...relationshipFormData,
      persona_id: personaId
    })
    setShowRelationshipForm(true)
  }

  const avatarColors = [
    { name: 'Purple', value: 'purple', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Pink', value: 'pink', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Blue', value: 'blue', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Green', value: 'green', gradient: 'from-green-500 to-green-600' },
    { name: 'Orange', value: 'orange', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Red', value: 'red', gradient: 'from-red-500 to-red-600' },
  ]

  const responseStyles = ['technical', 'balanced', 'casual', 'formal']
  const toneOptions = ['direct', 'friendly', 'warm', 'professional', 'playful']

  const handleStartCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      ai_name: '',
      ai_nickname: '',
      user_greeting: '',
      personality_traits: {
        technical: 50,
        friendly: 50,
        direct: 50,
        creative: 50,
        professional: 50
      },
      response_style: 'balanced',
      tone: 'friendly',
      sample_greeting: '',
      avatar_color: 'purple'
    })
    setShowForm(true)
  }

  const handleStartEdit = (persona: Persona) => {
    setEditingId(persona.id)
    setFormData({
      name: persona.name,
      ai_name: persona.ai_name,
      ai_nickname: persona.ai_nickname || '',
      user_greeting: persona.user_greeting,
      personality_traits: persona.personality_traits,
      response_style: persona.response_style,
      tone: persona.tone,
      sample_greeting: persona.sample_greeting || '',
      avatar_color: persona.avatar_color
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.ai_name || !formData.user_greeting) {
      toast.error('Please fill in all required fields')
      return
    }

    const success = editingId
      ? await updatePersona(editingId, formData)
      : await createPersona(formData)

    if (success) {
      setShowForm(false)
      setEditingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      await deletePersona(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultPersona(id)
  }

  const relationshipTypes = ['Kekasih', 'Sahabat', 'Teman', 'Partner Kerja', 'Keluarga']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Persona Manager</h2>
              <p className="text-sm text-secondary">Kelola Persona AI dan Karakter Pengguna</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => setActiveTab('personas')}
            className={`px-4 py-2 font-medium transition-all border-b-2 ${
              activeTab === 'personas'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Personas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 font-medium transition-all border-b-2 ${
              activeTab === 'characters'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Karakter Pengguna
            </div>
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'personas' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Buat Persona
              </button>
            </div>

            {/* Personas List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map((persona) => {
                  const relationships = personaRelationships[persona.id] || []
                  
                  return (
                    <motion.div
                      key={persona.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        persona.is_default
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                          avatarColors.find(c => c.value === persona.avatar_color)?.gradient || 'from-purple-500 to-purple-600'
                        } flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {persona.is_default === 1 && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <h3 className="font-bold text-lg">{persona.ai_name}</h3>
                            <span className="text-xs text-secondary">({persona.ai_nickname})</span>
                          </div>
                          <p className="text-sm text-secondary mb-2">
                            Memanggil Anda: <span className="font-medium text-primary">{persona.user_greeting}</span>
                          </p>
                          
                          {/* Relationships */}
                          {relationships.length > 0 && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
                                <Heart className="w-3 h-3" />
                                <span className="font-medium">Relasi:</span>
                              </div>
                              {relationships.map((rel) => (
                                <div key={rel.id} className="text-xs text-secondary mb-1 flex items-center justify-between">
                                  <span>
                                    {rel.character_name} ({rel.relationship_type}) → "{rel.primary_nickname}"
                                  </span>
                                  <button
                                    onClick={() => handleDeleteRelationship(rel.id, persona.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Personality Traits */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {Object.entries(persona.personality_traits).slice(0, 3).map(([trait, value]) => (
                              <span key={trait} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-surface-hover rounded-full">
                                {trait}: {value}
                              </span>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Tombol Hubungkan/Hubungan - Dinamis berdasarkan relasi */}
                            {relationships.length > 0 ? (
                              <div className="relative group">
                                <button
                                  onClick={() => {
                                    // Jika hanya 1 relasi, langsung edit
                                    if (relationships.length === 1) {
                                      handleStartEditRelationship(relationships[0], persona.id)
                                    }
                                    // Jika lebih dari 1, tampilkan menu (handled by group hover)
                                  }}
                                  className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg transition-all flex items-center gap-1"
                                  title="Edit relasi yang sudah ada"
                                >
                                  <Heart className="w-3 h-3" />
                                  Hubungan ({relationships.length})
                                </button>
                                
                                {/* Dropdown menu untuk multiple relationships */}
                                {relationships.length > 1 && (
                                  <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-10 min-w-[200px]">
                                    <div className="p-2 space-y-1">
                                      {relationships.map((rel) => (
                                        <button
                                          key={rel.id}
                                          onClick={() => handleStartEditRelationship(rel, persona.id)}
                                          className="w-full text-left text-xs px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded transition-colors"
                                        >
                                          Edit: {rel.character_name} ({rel.relationship_type})
                                        </button>
                                      ))}
                                      <div className="border-t border-gray-200 dark:border-dark-border my-1"></div>
                                      <button
                                        onClick={() => handleAddRelationshipToPersona(persona.id)}
                                        className="w-full text-left text-xs px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded transition-colors text-green-600 dark:text-green-400"
                                      >
                                        + Tambah Relasi Baru
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  fetchPersonaRelationships(persona.id)
                                  handleAddRelationshipToPersona(persona.id)
                                }}
                                className="text-xs px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg transition-all flex items-center gap-1"
                                title="Buat relasi baru"
                              >
                                <Link className="w-3 h-3" />
                                Hubungkan
                              </button>
                            )}
                            {persona.is_default !== 1 && (
                              <button
                                onClick={() => handleSetDefault(persona.id)}
                                className="text-xs px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg transition-all flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" />
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(persona)}
                              className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            {persona.is_default !== 1 && (
                              <button
                                onClick={() => handleDelete(persona.id)}
                                className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
        
        {/* Characters Tab Content */}
        {activeTab === 'characters' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  resetCharacterForm()
                  setEditingCharacterId(null)
                  setShowCharacterForm(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Karakter
              </button>
            </div>
            
            {/* Characters List */}
            {loadingCharacters ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.map((character) => {
                  const charRelationships = personaRelationships[`char_${character.id}`] || []
                  
                  return (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-6 h-6 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1">{character.name}</h3>
                          {character.bio && (
                            <p className="text-sm text-secondary mb-2">{character.bio}</p>
                          )}
                          
                          {/* Preferences */}
                          {character.preferences && Object.keys(character.preferences).length > 0 && (
                            <div className="mb-3">
                              {character.preferences.hobi && character.preferences.hobi.length > 0 && (
                                <p className="text-xs text-secondary">
                                  <span className="font-medium">Hobi:</span> {character.preferences.hobi.join(', ')}
                                </p>
                              )}
                              {character.preferences.kesukaan && (
                                <div className="text-xs text-secondary">
                                  {character.preferences.kesukaan.warna && (
                                    <p><span className="font-medium">Warna:</span> {character.preferences.kesukaan.warna}</p>
                                  )}
                                  {character.preferences.kesukaan.makanan && (
                                    <p><span className="font-medium">Makanan:</span> {character.preferences.kesukaan.makanan}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Relationships with Personas */}
                          {charRelationships.length > 0 && (
                            <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-1">
                                <Heart className="w-3 h-3" />
                                <span className="font-medium">Relasi dengan Persona:</span>
                              </div>
                              {charRelationships.map((rel) => (
                                <div key={rel.id} className="text-xs text-secondary">
                                  {rel.persona_ai_name} ({rel.relationship_type})
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditCharacter(character)}
                              className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCharacter(character.id)}
                              className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingId ? 'Edit Persona' : 'Create New Persona'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Persona <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* AI Name & Nickname */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nama AI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ai_name}
                      onChange={(e) => setFormData({ ...formData, ai_name: e.target.value })}
                      placeholder="e.g., Sarah"
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nickname</label>
                    <input
                      type="text"
                      value={formData.ai_nickname}
                      onChange={(e) => setFormData({ ...formData, ai_nickname: e.target.value })}
                      placeholder="e.g., Sar"
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* User Greeting */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI memanggil Anda <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.user_greeting}
                    onChange={(e) => setFormData({ ...formData, user_greeting: e.target.value })}
                    placeholder="e.g., Teman, Kawan, Boss, Bro"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-secondary mt-1">Contoh: "Halo <strong>{formData.user_greeting || 'Teman'}</strong>! Bagaimana kabarmu?"</p>
                </div>

                {/* Sample Greeting */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sample Greeting</label>
                  <textarea
                    value={formData.sample_greeting}
                    onChange={(e) => setFormData({ ...formData, sample_greeting: e.target.value })}
                    placeholder="e.g., Hai teman! Aku Sarah, senang bisa membantu kamu hari ini. Ada yang bisa aku bantu? 😊"
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Response Style & Tone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Response Style</label>
                    <select
                      value={formData.response_style}
                      onChange={(e) => setFormData({ ...formData, response_style: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    >
                      {responseStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tone</label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    >
                      {toneOptions.map(tone => (
                        <option key={tone} value={tone}>{tone}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Avatar Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {avatarColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, avatar_color: color.value })}
                        className={`h-12 rounded-lg bg-gradient-to-r ${color.gradient} transition-all ${
                          formData.avatar_color === color.value
                            ? 'ring-2 ring-offset-2 ring-primary scale-110'
                            : 'hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="block text-sm font-medium mb-3">Personality Traits (0-100)</label>
                  <div className="space-y-3">
                    {Object.entries(formData.personality_traits).map(([trait, value]) => (
                      <div key={trait}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{trait}</span>
                          <span className="text-sm font-medium text-primary">{value}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            personality_traits: {
                              ...formData.personality_traits,
                              [trait]: parseInt(e.target.value)
                            }
                          })}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                  >
                    {editingId ? 'Update Persona' : 'Create Persona'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Character Form Modal */}
      <AnimatePresence>
        {showCharacterForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCharacterForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingCharacterId ? 'Edit Karakter' : 'Tambah Karakter Pengguna'}
                </h3>
                <button
                  onClick={() => setShowCharacterForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={characterFormData.name}
                    onChange={(e) => setCharacterFormData({ ...characterFormData, name: e.target.value })}
                    placeholder="e.g., Lycus, Affif, Salma"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bio / Deskripsi</label>
                  <textarea
                    value={characterFormData.bio}
                    onChange={(e) => setCharacterFormData({ ...characterFormData, bio: e.target.value })}
                    placeholder="Developer, Designer, CEO, dll"
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Hobi */}
                <div>
                  <label className="block text-sm font-medium mb-2">Hobi (pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={characterFormData.preferences.hobi.join(', ')}
                    onChange={(e) => setCharacterFormData({
                      ...characterFormData,
                      preferences: {
                        ...characterFormData.preferences,
                        hobi: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                      }
                    })}
                    placeholder="e.g., coding, gaming, reading"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Kesukaan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Warna Favorit</label>
                    <input
                      type="text"
                      value={characterFormData.preferences.kesukaan.warna}
                      onChange={(e) => setCharacterFormData({
                        ...characterFormData,
                        preferences: {
                          ...characterFormData.preferences,
                          kesukaan: {
                            ...characterFormData.preferences.kesukaan,
                            warna: e.target.value
                          }
                        }
                      })}
                      placeholder="e.g., Purple, Blue"
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Makanan Favorit</label>
                    <input
                      type="text"
                      value={characterFormData.preferences.kesukaan.makanan}
                      onChange={(e) => setCharacterFormData({
                        ...characterFormData,
                        preferences: {
                          ...characterFormData.preferences,
                          kesukaan: {
                            ...characterFormData.preferences.kesukaan,
                            makanan: e.target.value
                          }
                        }
                      })}
                      placeholder="e.g., Pizza, Sushi"
                      className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingCharacterId ? handleUpdateCharacter : handleCreateCharacter}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                  >
                    {editingCharacterId ? 'Update Karakter' : 'Buat Karakter'}
                  </button>
                  <button
                    onClick={() => setShowCharacterForm(false)}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg font-medium transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Relationship Form Modal */}
      <AnimatePresence>
        {showRelationshipForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRelationshipForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingRelationshipId ? 'Edit Hubungan' : 'Hubungkan Persona dengan Karakter'}
                </h3>
                <button
                  onClick={() => {
                    setShowRelationshipForm(false)
                    setEditingRelationshipId(null)
                    resetRelationshipForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Persona Selection - Disabled saat edit */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Persona <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relationshipFormData.persona_id}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, persona_id: e.target.value })}
                    disabled={!!editingRelationshipId}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Pilih Persona</option>
                    {personas.map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.ai_name} ({persona.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Character Selection - Disabled saat edit */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Karakter Pengguna <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relationshipFormData.user_character_id}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, user_character_id: e.target.value })}
                    disabled={!!editingRelationshipId}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Pilih Karakter</option>
                    {characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Relationship Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Jenis Hubungan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relationshipFormData.relationship_type}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, relationship_type: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  >
                    {relationshipTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Nickname */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Panggilan Utama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={relationshipFormData.primary_nickname}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, primary_nickname: e.target.value })}
                    placeholder="e.g., Sayang, Kawan, Bro, Partner"
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-secondary mt-1">Panggilan yang akan digunakan secara default</p>
                </div>

                {/* Alternate Nicknames */}
                <div>
                  <label className="block text-sm font-medium mb-2">Panggilan Alternatif (untuk variasi mood)</label>
                  {relationshipFormData.alternate_nicknames.map((nickname, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => {
                          const newNicknames = [...relationshipFormData.alternate_nicknames]
                          newNicknames[index] = e.target.value
                          setRelationshipFormData({ ...relationshipFormData, alternate_nicknames: newNicknames })
                        }}
                        placeholder={`Panggilan alternatif ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary"
                      />
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newNicknames = relationshipFormData.alternate_nicknames.filter((_, i) => i !== index)
                            setRelationshipFormData({ ...relationshipFormData, alternate_nicknames: newNicknames })
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setRelationshipFormData({
                      ...relationshipFormData,
                      alternate_nicknames: [...relationshipFormData.alternate_nicknames, '']
                    })}
                    className="text-sm text-primary hover:text-secondary flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Panggilan Alternatif
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Catatan (Opsional)</label>
                  <textarea
                    value={relationshipFormData.notes}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, notes: e.target.value })}
                    placeholder="Catatan tambahan tentang relasi ini..."
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingRelationshipId ? handleUpdateRelationship : handleCreateRelationship}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                  >
                    {editingRelationshipId ? 'Update Hubungan' : 'Buat Relasi'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRelationshipForm(false)
                      setEditingRelationshipId(null)
                      resetRelationshipForm()
                    }}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg font-medium transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
