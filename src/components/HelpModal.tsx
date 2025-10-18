import { X, Upload, FileCode, Code2, FileText, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Tools Management Guide</h2>
              <p className="text-sm text-secondary">How to use ChimeraAI Tools Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
            data-testid="close-help-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Section 1: Dual Upload System */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold">1. Dual Upload System (Backend + Frontend)</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <p className="text-secondary">
                ChimeraAI menggunakan sistem <strong>Dual Upload</strong> di mana setiap tool <strong>WAJIB</strong> memiliki 2 file:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Backend */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-primary">Backend File (.py)</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-secondary">
                    <li>• File Python (.py) dengan logika backend</li>
                    <li>• Berisi fungsi <code className="px-2 py-0.5 bg-gray-200 dark:bg-dark-surface rounded">run(params)</code></li>
                    <li>• Dieksekusi di server backend</li>
                    <li>• Harus ada metadata di docstring</li>
                  </ul>
                </div>

                {/* Frontend */}
                <div className="p-4 bg-green-500/5 border-2 border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-600">Frontend File (.jsx/.tsx/.html/.js)</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-secondary">
                    <li>• File UI (.jsx, .tsx, .html, .js)</li>
                    <li>• Berisi interface user-facing</li>
                    <li>• Dirender di aplikasi</li>
                    <li>• Bisa standalone atau call backend</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Penting: Kedua file WAJIB di-upload bersamaan!
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Backend File Requirements */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold">2. Backend File Requirements (.py)</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <p className="text-secondary">
                File backend harus memenuhi struktur berikut:
              </p>
              
              <div className="bg-gray-900 dark:bg-black/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
{`"""
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
    
    Expected params:
    {
        "param1": value1,
        "param2": value2
    }
    """
    # Your logic here
    result = process(params)
    
    return {
        "success": True,
        "result": result
    }`}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm">✅ Wajib Ada:</p>
                <ul className="list-disc list-inside text-sm text-secondary space-y-1 pl-4">
                  <li>Docstring dengan metadata (NAME, CATEGORY, DESCRIPTION)</li>
                  <li>Fungsi <code className="px-2 py-0.5 bg-gray-200 dark:bg-dark-surface rounded">run(params)</code></li>
                  <li>Return dictionary dengan hasil</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Frontend File Examples */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">3. Frontend File Examples</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <p className="text-secondary">Frontend bisa berupa:</p>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                  <p className="font-semibold text-sm mb-1">📄 HTML File (.html)</p>
                  <p className="text-xs text-secondary">HTML standalone dengan CSS & JavaScript inline</p>
                </div>
                
                <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                  <p className="font-semibold text-sm mb-1">⚛️ React Component (.jsx / .tsx)</p>
                  <p className="text-xs text-secondary">React component yang akan di-render di iframe</p>
                </div>
                
                <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                  <p className="font-semibold text-sm mb-1">📜 JavaScript (.js)</p>
                  <p className="text-xs text-secondary">Vanilla JavaScript dengan DOM manipulation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Upload Process */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold">4. How to Upload Tool</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-secondary">
                <li>Klik tombol <strong className="text-primary">"+ Upload Tool"</strong></li>
                <li>Pilih <strong>Backend File</strong> (.py) di kolom kiri</li>
                <li>Pilih <strong>Frontend File</strong> (.jsx/.tsx/.html/.js) di kolom kanan</li>
                <li>Metadata akan otomatis terisi dari backend file</li>
                <li>Edit metadata jika perlu (name, category, version, author)</li>
                <li>Klik <strong>"Upload Tool"</strong></li>
                <li>Tool akan divalidasi dan disimpan</li>
              </ol>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Jika validasi berhasil, tool akan otomatis status "Active"
                </p>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Jika validasi gagal, tool akan status "Disabled" dan bisa diperbaiki nanti
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Managing Tools */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold">5. Managing Uploaded Tools</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <div className="space-y-2">
                <p className="font-semibold text-sm">Actions Available:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                    <p className="font-semibold text-sm">🔄 Toggle Status</p>
                    <p className="text-xs text-secondary">Enable/disable tool</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                    <p className="font-semibold text-sm">🗑️ Delete Tool</p>
                    <p className="text-xs text-secondary">Remove tool permanently</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                    <p className="font-semibold text-sm">🔍 Filter & Search</p>
                    <p className="text-xs text-secondary">Find tools by name, category, status</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                    <p className="font-semibold text-sm">▶️ Run Tool</p>
                    <p className="text-xs text-secondary">Execute tool from Tools page</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: File Structure */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold">6. File Storage Structure</h3>
            </div>
            
            <div className="pl-11 space-y-3">
              <p className="text-secondary">Tool files disimpan dengan struktur:</p>
              
              <div className="bg-gray-900 dark:bg-black/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
{`backend/
├── tools/                    ← Backend files
│   ├── devtools/
│   │   └── <tool-id>.py
│   ├── office/
│   │   └── <tool-id>.py
│   └── utilities/
│       └── <tool-id>.py
│
└── frontend_tools/          ← Frontend files
    ├── devtools/
    │   └── <tool-id>.html
    ├── office/
    │   └── <tool-id>.jsx
    └── utilities/
        └── <tool-id>.tsx`}
                </pre>
              </div>
              
              <p className="text-xs text-secondary">
                Setiap tool mendapat UUID unik. Files otomatis di-copy ke lokasi yang sesuai saat upload.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-surface">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary">
              💡 Tip: Lihat sample tools (Calculator, Text Formatter, Color Picker) sebagai referensi
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
              data-testid="close-help-button"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
