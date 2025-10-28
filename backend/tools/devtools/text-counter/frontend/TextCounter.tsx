import React, { useState } from 'react'
import { FileText, Hash, Type, AlignLeft, MessageSquare, TrendingUp, Sparkles } from 'lucide-react'

export default function TextCounter() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleCount = async () => {
    if (!text.trim()) {
      return
    }

    setLoading(true)
    try {
      // Call backend API - use relative URL so it works in any environment
      const response = await fetch('/api/tools/text-counter/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text
        })
      })
      
      const data = await response.json()
      
      // Handle nested result structure from tool executor
      if (data.success && data.result && data.result.success && data.result.result && data.result.result.data) {
        setResult(data.result.result.data)
      } else if (data.success && data.result && data.result.data) {
        setResult(data.result.data)
      } else if (data.data) {
        setResult(data.data)
      } else {
        console.error('Unexpected response format:', data)
      }
    } catch (error) {
      console.error('Failed to count text:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setText('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Text Counter</h1>
          <p className="text-gray-300">Analyze your text instantly</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-purple-400" />
                Input Text
              </h2>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
              >
                Clear
              </button>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              className="w-full h-64 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />

            <button
              onClick={handleCount}
              disabled={!text.trim() || loading}
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Count Statistics
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Statistics
            </h2>

            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p>Enter text and click "Count Statistics" to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Word Count */}
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-blue-300" />
                      </div>
                      <span className="text-gray-300">Words</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.word_count}</span>
                  </div>
                </div>

                {/* Character Count */}
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center">
                        <Type className="w-5 h-5 text-green-300" />
                      </div>
                      <span className="text-gray-300">Characters</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.char_count}</span>
                  </div>
                </div>

                {/* Characters (No Spaces) */}
                <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
                        <Type className="w-5 h-5 text-purple-300" />
                      </div>
                      <span className="text-gray-300">Chars (no spaces)</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.char_no_spaces}</span>
                  </div>
                </div>

                {/* Line Count */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/30 flex items-center justify-center">
                        <AlignLeft className="w-5 h-5 text-yellow-300" />
                      </div>
                      <span className="text-gray-300">Lines</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.line_count}</span>
                  </div>
                </div>

                {/* Sentence Count */}
                <div className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/30 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-pink-300" />
                      </div>
                      <span className="text-gray-300">Sentences</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.sentence_count}</span>
                  </div>
                </div>

                {/* Average Word Length */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-indigo-300" />
                      </div>
                      <span className="text-gray-300">Avg. Word Length</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{result.avg_word_length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
