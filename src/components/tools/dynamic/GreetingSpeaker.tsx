/**
 * Sapaan Login/Shutdown Tool
 * 
 * Automatic greeting speaker with espeak - Indonesian language
 * Menggunakan dependencies utama: lucide-react, Tailwind CSS
 */

import React, { useState, useEffect } from 'react'
import { Volume2, Sunrise, Power } from 'lucide-react'

interface GreetingSpeakerProps {
  toolId: string
  toolData?: any
}

const GreetingSpeaker: React.FC<GreetingSpeakerProps> = ({ toolId }) => {
  const [greeting, setGreeting] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [espeakAvailable, setEspeakAvailable] = useState<boolean | null>(null)
  const [eventType, setEventType] = useState('login')
  const [timeOfDay, setTimeOfDay] = useState('morning')
  const [autoSpoken, setAutoSpoken] = useState(false)
  const [lastSpoken, setLastSpoken] = useState<string | null>(null)

  // Get time icon based on time of day
  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <span className="text-4xl">🌅</span>
      case 'afternoon':
        return <span className="text-4xl">☀️</span>
      case 'evening':
        return <span className="text-4xl">🌆</span>
      case 'night':
        return <span className="text-4xl">🌙</span>
      default:
        return <span className="text-4xl">🕐</span>
    }
  }

  // Check espeak availability
  useEffect(() => {
    checkEspeak()
  }, [])

  // Auto-speak on login (once)
  useEffect(() => {
    if (espeakAvailable && !autoSpoken) {
      setTimeout(() => {
        handleSpeak('login', true)
        setAutoSpoken(true)
      }, 1000)
    }
  }, [espeakAvailable, autoSpoken])

  const checkEspeak = async () => {
    try {
      const response = await fetch(`http://localhost:8001/tools/${toolId}/check-espeak`)
      const data = await response.json()
      setEspeakAvailable(data.available)
    } catch (error) {
      console.error('Error checking espeak:', error)
      setEspeakAvailable(false)
    }
  }

  const fetchGreeting = async (type: string) => {
    try {
      const response = await fetch(`http://localhost:8001/tools/${toolId}/greetings/${type}`)
      const data = await response.json()
      if (data.success) {
        setGreeting(data.greeting)
        setTimeOfDay(data.time_of_day)
        setEventType(type)
      }
    } catch (error) {
      console.error('Error fetching greeting:', error)
    }
  }

  const handleSpeak = async (type: string, isAuto = false) => {
    setIsSpeaking(true)
    try {
      const response = await fetch(
        `http://localhost:8001/tools/${toolId}/speak?event_type=${type}`,
        { method: 'POST' }
      )
      const data = await response.json()
      
      if (data.success) {
        setGreeting(data.text_spoken)
        setTimeOfDay(type === 'shutdown' ? 'shutdown' : data.time_of_day || 'morning')
        setEventType(type)
        setLastSpoken(new Date().toLocaleTimeString('id-ID'))
      }
    } catch (error) {
      console.error('Error speaking:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sapaan Login/Shutdown
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sapaan otomatis dengan espeak - Bahasa Indonesia
                </p>
              </div>
            </div>
            
            {/* Espeak Status */}
            <div className="flex items-center space-x-2">
              {espeakAvailable === null ? (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-2">
                  <span className="text-xl">⏳</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Checking...</span>
                </div>
              ) : espeakAvailable ? (
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center space-x-2">
                  <span className="text-xl">✅</span>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">espeak Ready</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center space-x-2">
                  <span className="text-xl">❌</span>
                  <span className="text-sm text-red-700 dark:text-red-300 font-medium">espeak Not Found</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Current Greeting Display */}
        {greeting && (
          <div className="mb-8 bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getTimeIcon()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Sapaan Terakhir:
                </h2>
                <p className="text-3xl font-bold text-gray-900 dark:text-white leading-relaxed">
                  {greeting}
                </p>
                {lastSpoken && (
                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-lg">🕐</span>
                    <span>Diucapkan pada: {lastSpoken}</span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {isSpeaking ? (
                  <span className="text-4xl animate-pulse">🔊</span>
                ) : (
                  <span className="text-4xl opacity-30">🔇</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Login Greeting */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <Sunrise className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sapaan Login</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sapaan saat masuk aplikasi</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSpeak('login')}
                disabled={!espeakAvailable || isSpeaking}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
              >
                {isSpeaking ? (
                  <>
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span>Berbicara...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>Ucapkan Sapaan Login</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => fetchGreeting('login')}
                disabled={isSpeaking}
                className="w-full px-6 py-3 bg-white dark:bg-dark-background border-2 border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:border-gray-300 disabled:text-gray-400 font-medium rounded-xl transition-all disabled:cursor-not-allowed"
              >
                Lihat Teks Sapaan Saja
              </button>
            </div>
          </div>

          {/* Shutdown Greeting */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sapaan Shutdown</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sapaan saat keluar aplikasi</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSpeak('shutdown')}
                disabled={!espeakAvailable || isSpeaking}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
              >
                {isSpeaking ? (
                  <>
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span>Berbicara...</span>
                  </>
                ) : (
                  <>
                    <Power className="w-5 h-5" />
                    <span>Ucapkan Sapaan Shutdown</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => fetchGreeting('shutdown')}
                disabled={isSpeaking}
                className="w-full px-6 py-3 bg-white dark:bg-dark-background border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:border-gray-300 disabled:text-gray-400 font-medium rounded-xl transition-all disabled:cursor-not-allowed"
              >
                Lihat Teks Sapaan Saja
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Volume2 className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">Tentang Tool Ini</h3>
              <div className="space-y-2 text-white/90">
                <p>• Sapaan otomatis saat login aplikasi</p>
                <p>• Variasi sapaan berbeda setiap kali (tidak membosankan!)</p>
                <p>• Sapaan disesuaikan dengan waktu: pagi, siang, sore, malam</p>
                <p>• Menggunakan espeak untuk text-to-speech</p>
                <p>• Bahasa Indonesia</p>
              </div>
              
              {!espeakAvailable && (
                <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
                  <p className="font-semibold mb-2">⚠️ espeak belum terinstall</p>
                  <p className="text-sm mb-2">Install dengan perintah:</p>
                  <code className="block bg-black/30 px-3 py-2 rounded text-sm font-mono">
                    sudo apt-get install espeak
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GreetingSpeaker
