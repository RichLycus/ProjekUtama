import { 
  Save, 
  Play, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Undo,
  Redo,
  Grid3x3,
  Layout,
  Scissors
} from 'lucide-react'

interface EditorToolbarProps {
  onSave?: () => void
  onRun?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onAutoLayout?: () => void
  onToggleGrid?: () => void
  onToggleDeleteMode?: () => void
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  showGrid?: boolean
  deleteMode?: boolean
}

export default function EditorToolbar({
  onSave,
  onRun,
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onAutoLayout,
  onToggleGrid,
  onToggleDeleteMode,
  hasUnsavedChanges = false,
  canUndo = false,
  canRedo = false,
  showGrid = true,
  deleteMode = false,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border shadow-sm">
      {/* Primary actions */}
      <div className="flex items-center gap-2 border-r border-gray-200 dark:border-dark-border pr-3">
        {onSave && (
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-primary hover:bg-secondary text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors text-sm font-medium
            "
            title="Save workflow (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}
        
        {onRun && (
          <button
            onClick={onRun}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-green-600 hover:bg-green-700 text-white
              transition-colors text-sm font-medium
            "
            title="Test workflow"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Test</span>
          </button>
        )}
      </div>
      
      {/* History actions */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-dark-border pr-3">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors text-gray-700 dark:text-gray-300
            "
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
        )}
        
        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors text-gray-700 dark:text-gray-300
            "
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* View controls */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-dark-border pr-3">
        {onZoomIn && (
          <button
            onClick={onZoomIn}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              transition-colors text-gray-700 dark:text-gray-300
            "
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}
        
        {onZoomOut && (
          <button
            onClick={onZoomOut}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              transition-colors text-gray-700 dark:text-gray-300
            "
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        )}
        
        {onFitView && (
          <button
            onClick={onFitView}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              transition-colors text-gray-700 dark:text-gray-300
            "
            title="Fit view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Layout controls */}
      <div className="flex items-center gap-1">
        {onAutoLayout && (
          <button
            onClick={onAutoLayout}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-dark-surface
              transition-colors text-gray-700 dark:text-gray-300
              text-sm font-medium
            "
            title="Auto layout"
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Layout</span>
          </button>
        )}
        
        {onToggleGrid && (
          <button
            onClick={onToggleGrid}
            className={`
              p-2 rounded-lg transition-colors
              ${showGrid 
                ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-700 dark:text-gray-300'
              }
            `}
            title="Toggle grid"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        )}
        
        {onToggleDeleteMode && (
          <button
            onClick={onToggleDeleteMode}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${deleteMode
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-700 dark:text-gray-300'
              }
            `}
            title={deleteMode ? "Exit delete mode" : "Delete mode: Click edges to remove (or use Ctrl+D)"}
          >
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">{deleteMode ? 'Delete Mode ON' : 'Delete Mode'}</span>
          </button>
        )}
      </div>
      
      {/* Status indicator */}
      {hasUnsavedChanges && (
        <div className="ml-auto flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Unsaved changes</span>
        </div>
      )}
    </div>
  )
}
