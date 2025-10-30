import { ArrowLeft, Upload, FileCode, Package, CheckCircle, AlertCircle, Code, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ToolsGuidePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header dengan Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tools')}
            className="flex items-center gap-2 px-4 py-2 glass hover:glass-strong rounded-lg mb-6 transition-all"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tools</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Tools Management Guide
              </h1>
              <p className="text-secondary mt-1">How to use ChimeraAI Tools Management</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          
          {/* 1. Dual Upload System */}
          <section className="glass-strong rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">1. Dual Upload System (Backend + Frontend)</h2>
                <p className="text-secondary">
                  ChimeraAI menggunakan sistem <span className="text-primary font-semibold">Dual Upload</span> di mana setiap tool <span className="font-bold text-white">WAJIB</span> memiliki 2 file:
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {/* Backend File */}
              <div className="glass rounded-lg p-5 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-blue-400">Backend File (.py)</h3>
                </div>
                <ul className="space-y-2 text-sm text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>File Python (.py) dengan logika backend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Berisi fungsi <code className="px-1.5 py-0.5 bg-dark-surface rounded text-blue-300">run(params)</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Dieksekusi di server backend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Harus ada metadata di docstring</span>
                  </li>
                </ul>
              </div>

              {/* Frontend File */}
              <div className="glass rounded-lg p-5 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-3">
                  <FileCode className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-green-400">Frontend File (.tsx)</h3>
                </div>
                <ul className="space-y-2 text-sm text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><span className="font-bold text-white">HANYA boleh .tsx</span> (tidak boleh .jsx, .html, .js)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Berisi interface user-facing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Dirender di aplikasi frontend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Bisa menggunakan dependencies dari <code className="px-1.5 py-0.5 bg-dark-surface rounded text-green-300">package.json</code></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-400 mb-1">Penting: Kedua file WAJIB di-upload bersamaan!</p>
                  <p className="text-secondary">Backend tidak bisa berjalan tanpa frontend, begitu juga sebaliknya.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Backend File Requirements */}
          <section className="glass-strong rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Code className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">2. Backend File Requirements (.py)</h2>
                <p className="text-secondary mb-4">
                  File backend harus memenuhi struktur berikut:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-lg p-4">
                <pre className="text-sm overflow-x-auto custom-scrollbar">
                  <code className="text-blue-300">{`"""
Tool Name Backend

NAME: Tool Name
CATEGORY: DevTools
DESCRIPTION: Brief description
VERSION: 1.0.0
AUTHOR: Your Name
"""

def run(params):
    """
    Main execution function
    
    Args:
        params (dict): Input parameters
        
    Returns:
        dict: Tool execution result
    """
    # Your backend logic here
    result = {
        "success": True,
        "data": "Tool result"
    }
    return result`}</code>
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Yang Harus Ada:
                  </h4>
                  <ul className="space-y-1 text-sm text-secondary">
                    <li>• Metadata di docstring (NAME, CATEGORY, etc)</li>
                    <li>• Fungsi <code className="px-1 py-0.5 bg-dark-surface rounded text-blue-300">run(params)</code></li>
                    <li>• Return dict dengan key "success" dan "data"</li>
                    <li>• Import dependencies yang diperlukan</li>
                  </ul>
                </div>

                <div className="glass rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Yang Dilarang:
                  </h4>
                  <ul className="space-y-1 text-sm text-secondary">
                    <li>• Hardcoded absolute paths (/app/...)</li>
                    <li>• Akses langsung ke filesystem tanpa validasi</li>
                    <li>• Import module yang tidak ada di requirements.txt</li>
                    <li>• Infinite loops atau blocking operations</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-400 mb-1">PENTING: Backend TIDAK perlu app = FastAPI()!</p>
                    <p className="text-secondary">Backend cukup berisi function <code className="px-1 py-0.5 bg-dark-surface rounded text-blue-300">run(params)</code>. Sistem akan menjalankannya secara otomatis.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Frontend File Requirements */}
          <section className="glass-strong rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">3. Frontend File Requirements (.tsx)</h2>
                <p className="text-secondary mb-4">
                  Frontend file <span className="font-bold text-white">HANYA boleh format .tsx</span>. Tidak boleh menggunakan .jsx, .html, atau .js.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-lg p-4">
                <pre className="text-sm overflow-x-auto custom-scrollbar">
                  <code className="text-green-300">{`import React, { useState } from 'react'
import { Calculator } from 'lucide-react' // ✅ Bisa pakai Lucide React

export default function ToolName() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExecute = async () => {
    setLoading(true)
    try {
      // ⚠️ PENTING: Gunakan endpoint dengan tool_id di body!
      // Backend URL akan auto-detect dari referer header
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Parameter tool
          text: 'Sample input',
          // Parameters lainnya...
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
      } else {
        console.error('Tool execution failed:', data.error)
      }
    } catch (error) {
      console.error('API call failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6"> {/* ✅ Bisa pakai Tailwind CSS */}
      <h1 className="text-2xl font-bold mb-4">Tool Name</h1>
      
      <button 
        onClick={handleExecute}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 
                   disabled:bg-gray-400 text-white rounded"
      >
        {loading ? 'Processing...' : 'Execute'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}`}</code>
                </pre>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-400 mb-2">Dependencies yang Bisa Digunakan:</p>
                    <ul className="space-y-1 text-secondary">
                      <li>• <span className="text-green-300 font-mono">React</span> - Core React library</li>
                      <li>• <span className="text-green-300 font-mono">Tailwind CSS</span> - Utility-first CSS framework</li>
                      <li>• <span className="text-green-300 font-mono">Lucide React</span> - Icon library</li>
                      <li>• Semua dependencies yang ada di <code className="px-1 py-0.5 bg-dark-surface rounded text-green-300">/app/package.json</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-400 mb-2">Yang Dilarang:</p>
                    <ul className="space-y-1 text-secondary">
                      <li>• Menggunakan format selain <span className="font-bold">.tsx</span> (seperti .jsx, .html, .js)</li>
                      <li>• Menggunakan iframe untuk load konten eksternal</li>
                      <li>• Import dependencies yang tidak ada di package.json</li>
                      <li>• Inline styles yang berlebihan (gunakan Tailwind CSS)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Validation & Auto-Cleanup */}
          <section className="glass-strong rounded-xl p-6 border border-red-500/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">4. Validasi & Auto-Cleanup</h2>
                <p className="text-secondary">
                  Sistem akan otomatis memvalidasi file backend dan frontend yang di-upload.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-400 mb-2">✅ Jika Validasi Berhasil:</p>
                    <ul className="space-y-1 text-secondary">
                      <li>• Tool disimpan di <code className="px-1 py-0.5 bg-dark-surface rounded">tools/{'{category}'}/{'{slug}'}/</code></li>
                      <li>• Status tool: <span className="text-green-400 font-bold">active</span></li>
                      <li>• Tool langsung bisa digunakan</li>
                      <li>• File structure:
                        <pre className="mt-2 text-xs bg-dark-surface/50 rounded p-2">
{`tools/devtools/text-counter/
├── backend/
│   └── main.py
├── frontend/
│   └── TextCounter.tsx
└── text-counter.yaml`}
                        </pre>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-400 mb-2">❌ Jika Validasi Gagal:</p>
                    <ul className="space-y-1 text-secondary">
                      <li>• Tool directory <span className="font-bold text-red-400">DIHAPUS OTOMATIS</span></li>
                      <li>• Error message ditampilkan dengan detail</li>
                      <li>• Anda perlu fix error dan upload ulang</li>
                      <li>• Tidak ada tool dengan status "disabled" yang tersisa</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-400 mb-2">⚠️ Common Validation Errors:</p>
                    <ul className="space-y-1 text-secondary">
                      <li>• Backend: Missing <code className="px-1 py-0.5 bg-dark-surface rounded">run(params)</code> function</li>
                      <li>• Backend: Missing metadata di docstring</li>
                      <li>• Frontend: File bukan format .tsx</li>
                      <li>• Frontend: Import dependencies yang tidak ada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Upload Flow */}
          <section className="glass-strong rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">5. Cara Upload Tool</h2>
                <p className="text-secondary">
                  Ikuti langkah-langkah berikut untuk upload tool baru:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 glass rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold mb-1">Buka Settings Page</p>
                  <p className="text-sm text-secondary">Klik tombol "Manage Tools" di halaman Tools atau navigasi ke Settings</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 glass rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold mb-1">Pilih Upload Method</p>
                  <p className="text-sm text-secondary">Pilih "Dual Upload" atau "ZIP Upload" sesuai kebutuhan</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 glass rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold mb-1">Upload Files</p>
                  <p className="text-sm text-secondary">Upload backend (.py) dan frontend (.tsx) sesuai requirements di atas</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 glass rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold mb-1">Validation & Activation</p>
                  <p className="text-sm text-secondary">Sistem akan validate files, jika valid tool akan langsung active</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8">
            <button
              onClick={() => navigate('/settings')}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Go to Settings & Upload Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
