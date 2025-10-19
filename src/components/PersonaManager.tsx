import { useState, useEffect } from 'react'
import { usePersonaStore, Persona } from '@/store/personaStore'
import { Users, Plus, Edit2, Trash2, Star, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function PersonaManager() {
  const { personas, fetchPersonas, createPersona, updatePersona, deletePersona, setDefaultPersona, loading } = usePersonaStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  useEffect(() => {
    fetchPersonas()
  }, [])

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
              <p className="text-sm text-secondary">Create and manage AI personalities</p>
            </div>
          </div>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Persona
          </button>
        </div>

        {/* Personas List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
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
                    <p className="text-xs text-secondary mb-3 line-clamp-2">
                      {persona.sample_greeting}
                    </p>

                    {/* Personality Traits */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(persona.personality_traits).slice(0, 3).map(([trait, value]) => (
                        <span key={trait} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-surface-hover rounded-full">
                          {trait}: {value}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
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
            ))}
          </div>
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
    </div>
  )
}
