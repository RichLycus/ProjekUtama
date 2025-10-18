export default function SettingsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-display font-bold text-text mb-6">
        Settings
      </h1>
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-text mb-4">Appearance</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Theme</span>
              <span className="text-text font-medium">Dark (Default)</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-text mb-4">Electron Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Status:</span>
              <span className="text-green-500 font-medium">Running</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">IPC:</span>
              <span className="text-green-500 font-medium">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}