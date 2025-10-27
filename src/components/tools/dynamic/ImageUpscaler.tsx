/**
 * Image Scaling Tool (4K Upscaler)
 * 
 * AI-powered image and video upscaling using PyTorch
 * Menggunakan dependencies utama: lucide-react, Tailwind CSS
 */

import React, { useState, useEffect } from 'react'
import { 
  Upload, Download, Image as ImageIcon, Film, Cpu, Zap, 
  CheckCircle, XCircle, Trash2, RefreshCw, ArrowUp 
} from 'lucide-react'

interface ImageUpscalerProps {
  toolId: string
  toolData?: any
}

interface SystemStatus {
  device: string
  cuda_available: boolean
  torch_version: string
  gpu_info?: {
    name: string
    memory_total: number
    memory_allocated: number
    memory_cached: number
  }
}

interface UpscaleResult {
  success: boolean
  file_id?: string
  file_type?: string
  download_url?: string
  device?: string
  original_size?: string
  upscaled_size?: string
  scale_factor?: number
  frames_processed?: number
  error?: string
}

const ImageUpscaler: React.FC<ImageUpscalerProps> = ({ toolId }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<UpscaleResult | null>(null)
  const [scale, setScale] = useState(4)
  const [useAI, setUseAI] = useState(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check system status
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8001/tools/${toolId}/status`)
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
    const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm']

    if (imageExts.includes(ext)) {
      setFileType('image')
      // Create preview for images
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else if (videoExts.includes(ext)) {
      setFileType('video')
      setPreview(null)
      // Video scale limited to 2x
      if (scale > 2) setScale(2)
    } else {
      setError('Format tidak didukung')
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError(null)
  }

  const handleUpscale = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('scale', scale.toString())
      formData.append('use_ai', useAI.toString())

      const response = await fetch(
        `http://localhost:8001/tools/${toolId}/upscale`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Processing gagal')
      }
    } catch (error) {
      console.error('Error upscaling:', error)
      setError('Terjadi kesalahan saat proses upscaling')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (result && result.download_url) {
      window.location.href = `http://localhost:8001/tools/${toolId}${result.download_url}`
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setFileType(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <ArrowUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Image Scaling Tool (4K Upscaler)
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI-powered image and video upscaling with PyTorch
                </p>
              </div>
            </div>

            {/* System Status */}
            {systemStatus && (
              <div className="flex items-center space-x-4">
                {/* Device Status */}
                <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  systemStatus.cuda_available 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {systemStatus.cuda_available ? (
                    <>
                      <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">GPU Mode</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">CPU Mode</span>
                    </>
                  )}
                </div>

                {/* PyTorch Version */}
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    PyTorch {systemStatus.torch_version}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Upload Section */}
        {!file && (
          <div 
            className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Upload Image atau Video
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Klik atau drag & drop file di sini
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-400 dark:text-gray-500">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>PNG, JPG, GIF, BMP, WebP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4" />
                  <span>MP4, AVI, MOV, MKV</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Max 50MB</p>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Processing Interface */}
        {file && (
          <div className="space-y-6">
            {/* File Info & Preview */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {fileType === 'image' ? (
                    <ImageIcon className="w-8 h-8 text-purple-500" />
                  ) : (
                    <Film className="w-8 h-8 text-pink-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {fileType === 'image' ? 'Image' : 'Video'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Image Preview */}
              {preview && (
                <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  <img src={preview} alt="Preview" className="max-h-64 rounded-lg" />
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-border">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                Pengaturan Upscaling
              </h3>
              
              <div className="space-y-4">
                {/* Scale Factor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scale Factor: {scale}x
                  </label>
                  <div className="flex items-center space-x-4">
                    {(fileType === 'video' ? [2] : [2, 3, 4, 8]).map((factor) => (
                      <button
                        key={factor}
                        onClick={() => setScale(factor)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                          scale === factor
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {factor}x
                      </button>
                    ))}
                  </div>
                  {fileType === 'video' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      * Video dibatasi 2x untuk performa optimal
                    </p>
                  )}
                </div>

                {/* Use AI Toggle */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gunakan AI Enhancement {systemStatus?.cuda_available && '(GPU)'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                    {useAI && systemStatus?.cuda_available 
                      ? 'Menggunakan GPU untuk kualitas terbaik'
                      : 'Menggunakan traditional upscaling (lebih cepat)'}
                  </p>
                </div>
              </div>

              {/* Process Button */}
              <button
                onClick={handleUpscale}
                disabled={isProcessing}
                className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-5 h-5" />
                    <span>Upscale {fileType === 'image' ? 'Image' : 'Video'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Error</h4>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && result.success && (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                        Upscaling Berhasil!
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.original_size} → {result.upscaled_size} ({result.scale_factor}x)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                </div>

                {/* Processing Info */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Device</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {result.device?.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scale</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {result.scale_factor}x
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {result.original_size}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Upscaled</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {result.upscaled_size}
                    </p>
                  </div>
                </div>

                {result.frames_processed && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>{result.frames_processed}</strong> frames berhasil diproses
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-surface rounded-xl p-6 border border-gray-200 dark:border-dark-border">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">GPU Acceleration</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Otomatis menggunakan GPU jika tersedia, fallback ke CPU jika tidak
            </p>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-xl p-6 border border-gray-200 dark:border-dark-border">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Multi-Format Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support image (PNG, JPG, GIF) dan video (MP4, AVI, MOV, MKV)
            </p>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-xl p-6 border border-gray-200 dark:border-dark-border">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <ArrowUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Multiple Scales</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upscale 2x, 3x, 4x, atau 8x dengan kualitas tinggi
            </p>
          </div>
        </div>

        {/* GPU Info */}
        {systemStatus?.gpu_info && (
          <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">GPU Terdeteksi!</h3>
                <p className="text-white/80">{systemStatus.gpu_info.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-white/70 mb-1">Total Memory</p>
                <p className="font-semibold">
                  {(systemStatus.gpu_info.memory_total / (1024**3)).toFixed(2)} GB
                </p>
              </div>
              <div>
                <p className="text-white/70 mb-1">Allocated</p>
                <p className="font-semibold">
                  {(systemStatus.gpu_info.memory_allocated / (1024**3)).toFixed(2)} GB
                </p>
              </div>
              <div>
                <p className="text-white/70 mb-1">Cached</p>
                <p className="font-semibold">
                  {(systemStatus.gpu_info.memory_cached / (1024**3)).toFixed(2)} GB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageUpscaler
