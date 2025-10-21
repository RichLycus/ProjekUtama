import { useState, useEffect } from 'react'
import { Gamepad2, Trash2, Play, Upload, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { API_ENDPOINTS } from '@/lib/backend'
import toast from 'react-hot-toast'
import UploadGameModal from '@/components/UploadGameModal'

interface Game {
  id: string
  name: string
  description: string
  cover_image_url: string
  folder_path: string
  index_file: string
  file_size: number
  status: string
  uploaded_at: string
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const loadGames = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.BACKEND_URL}/api/games/list`)
      const data = await response.json()
      
      if (data.success) {
        setGames(data.games)
      } else {
        toast.error('Failed to load games')
      }
    } catch (error) {
      console.error('Error loading games:', error)
      toast.error('Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  const handlePlayGame = (game: Game) => {
    // Construct game URL
    const gameUrl = `${API_ENDPOINTS.BACKEND_URL}/api/games/${game.id}/files/${game.index_file}`
    
    // Open game in new window via Electron IPC
    if (window.electronAPI && window.electronAPI.launchGame) {
      window.electronAPI.launchGame({
        gameId: game.id,
        gameName: game.name,
        gameUrl: gameUrl
      })
      toast.success(`🎮 Launching ${game.name}...`)
    } else {
      // Fallback - open in new browser tab
      window.open(gameUrl, '_blank')
      toast.success(`🎮 Opening ${game.name} in new tab...`)
    }
  }

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      return
    }

    const toastId = toast.loading('Deleting game...')
    try {
      const response = await fetch(`${API_ENDPOINTS.BACKEND_URL}/api/games/${gameId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success('🗑️ Game deleted!', { id: toastId })
        loadGames() // Refresh list
      } else {
        toast.error(data.message || 'Failed to delete game', { id: toastId })
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('Failed to delete game', { id: toastId })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen p-6" data-testid="games-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Web Games</h1>
              <p className="text-secondary">Play WebGL games directly in ChimeraAI</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadGames}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
              data-testid="refresh-games-button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
              data-testid="upload-game-button"
            >
              <Upload className="w-4 h-4" />
              Upload Game
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="glass rounded-xl p-4 flex-1">
            <p className="text-sm text-secondary mb-1">Total Games</p>
            <p className="text-2xl font-bold">{games.length}</p>
          </div>
          <div className="glass rounded-xl p-4 flex-1">
            <p className="text-sm text-secondary mb-1">Total Size</p>
            <p className="text-2xl font-bold">
              {formatFileSize(games.reduce((acc, game) => acc + game.file_size, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && games.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Games Yet</h3>
          <p className="text-secondary mb-6 max-w-md mx-auto">
            Upload your first WebGL game to start playing. Games should be packaged as ZIP files with an index.html entry point.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Your First Game
          </button>
        </motion.div>
      )}

      {/* Games Grid */}
      {!loading && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl overflow-hidden group hover:shadow-xl transition-all"
              data-testid={`game-card-${game.id}`}
            >
              {/* Cover Image */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <img
                  src={game.cover_image_url}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(game.name.slice(0, 10))}`
                  }}
                />
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handlePlayGame(game)}
                    className="w-16 h-16 rounded-full bg-primary hover:bg-secondary flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform"
                    data-testid={`play-game-${game.id}`}
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                </div>
              </div>

              {/* Game Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate" title={game.name}>
                  {game.name}
                </h3>
                <p className="text-sm text-secondary line-clamp-2 mb-3 min-h-[2.5rem]">
                  {game.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-secondary mb-3">
                  <span>{formatFileSize(game.file_size)}</span>
                  <span>{new Date(game.uploaded_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePlayGame(game)}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    data-testid={`play-button-${game.id}`}
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.id, game.name)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all"
                    title="Delete game"
                    data-testid={`delete-button-${game.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadGameModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          loadGames()
          setIsUploadModalOpen(false)
        }}
      />
    </div>
  )
}