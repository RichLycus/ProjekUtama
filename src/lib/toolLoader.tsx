/**
 * Dynamic Tool Component Loader (Auto-Discovery System)
 * 
 * This system automatically discovers and loads tools as native React components
 * with full access to main app dependencies (lucide-react, Tailwind, etc.)
 * 
 * NO MANUAL REGISTRATION NEEDED! 🎉
 * Tools are auto-discovered from /app/backend/frontend_tools/ directory
 * 
 * Structure: /app/backend/frontend_tools/{tool-slug}/{ComponentName}.tsx
 * 
 * Benefits:
 * - Clean separation: src/ = app code, backend/frontend_tools/ = tool components
 * - Easy management: All tool files in one place
 * - Scalability: 1000 tools won't pollute src/
 * - Upload-friendly: ZIP upload auto-extracts to backend/frontend_tools/
 */

import React, { lazy, Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Tool component props interface
export interface ToolComponentProps {
  toolId: string
  toolData: any
}

// Loading fallback component
const ToolLoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-white dark:bg-dark-background">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
      <p className="text-secondary text-lg">Loading tool...</p>
    </div>
  </div>
)

/**
 * Auto-discover tool components using Vite's glob import
 * 
 * ONLY scans React/JS modules (.tsx, .jsx) - Vite can only import these!
 * HTML tools (.html) are loaded via API endpoint (see loadToolComponent)
 * 
 * Structure: 
 * - frontend_tools/{tool-slug}/{ComponentName}.tsx (legacy)
 * - tools/{category}/{slug}/frontend/{ComponentName}.tsx (new structure)
 * 
 * Vite will create separate chunks for code splitting
 */
const toolModules = {
  ...import.meta.glob('../../backend/frontend_tools/**/*.{tsx,jsx}'),
  ...import.meta.glob('../../backend/tools/**/frontend/*.{tsx,jsx}')
}

console.log('🔍 Auto-discovered tool modules:', Object.keys(toolModules))

/**
 * Build dynamic registry from discovered modules
 * Maps tool component names to their import functions
 */
const buildDynamicRegistry = () => {
  const registry: Record<string, () => Promise<{ default: ComponentType<any> }>> = {}
  
  Object.keys(toolModules).forEach((path) => {
    // Extract component name from path
    // Example: '../../backend/frontend_tools/greeting-speaker/GreetingSpeaker.tsx' -> 'GreetingSpeaker'
    const match = path.match(/\/([^/]+)\.(tsx|jsx)$/)
    if (match) {
      const componentName = match[1]
      const extension = match[2]
      registry[componentName] = toolModules[path] as () => Promise<{ default: ComponentType<any> }>
      
      console.log(`✓ Registered React component: ${componentName} (.${extension})`)
    }
  })
  
  return registry
}

/**
 * Dynamic Tool Registry - Auto-built from glob import
 * Updates automatically when new tools are added to the directory!
 */
export const DynamicToolRegistry = buildDynamicRegistry()

// Error boundary for tool components
export class ToolErrorBoundary extends React.Component<
  { children: React.ReactNode; toolName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Tool Error [${this.props.toolName}]:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen p-8 bg-white dark:bg-dark-background">
          <div className="text-center max-w-2xl">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Tool Error</h2>
            <p className="text-secondary mb-4">
              Failed to load tool: {this.props.toolName}
            </p>
            <div className="bg-gray-100 dark:bg-dark-surface rounded-lg p-4 text-left">
              <p className="font-mono text-sm text-red-600 dark:text-red-400 mb-2">
                {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-64 text-gray-700 dark:text-gray-300">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg transition-colors"
            >
              Reload Tool
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Name Mapping - Maps tool display names to component names
 * 
 * This is the ONLY place where you might need to add mappings
 * if your tool name doesn't match the component filename
 * 
 * Convention: Use PascalCase for component filenames
 * Example: "My Cool Tool" -> MyCoolTool.tsx
 */
const ToolNameMappings: Record<string, string> = {
  // Map tool display names to component names (for pre-built tools only)
  'Sapaan Login/Shutdown': 'GreetingSpeaker',
  'Image Scaling Tool (4K Upscaler)': 'ImageUpscaler',
  'Text Counter': 'TextCounter',
  'text-counter': 'TextCounter',
  
  // NOTE: No fallback mapping for generic uploads
  // Uploaded tools will use dynamic iframe loading with shared dependencies
}

/**
 * Smart name matching - tries to intelligently match tool names to components
 */
const findComponentNameForTool = (toolName: string): string | null => {
  // 1. Check direct mapping first
  if (ToolNameMappings[toolName]) {
    return ToolNameMappings[toolName]
  }
  
  // 2. Try exact match (case-insensitive)
  const availableComponents = Object.keys(DynamicToolRegistry)
  const exactMatch = availableComponents.find(
    comp => comp.toLowerCase() === toolName.toLowerCase()
  )
  if (exactMatch) return exactMatch
  
  // 3. Try PascalCase conversion
  // "Sapaan Login/Shutdown" -> "SapaanLoginShutdown"
  const pascalCase = toolName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
  
  if (DynamicToolRegistry[pascalCase]) {
    return pascalCase
  }
  
  // 4. Try kebab-case variations
  const kebabCase = toolName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  const kebabMatch = availableComponents.find(
    comp => comp.toLowerCase().replace(/[^a-z0-9]/g, '-') === kebabCase
  )
  if (kebabMatch) return kebabMatch
  
  // 5. Try partial match (contains)
  const partialMatch = availableComponents.find(comp =>
    comp.toLowerCase().includes(toolName.toLowerCase().replace(/[^a-z0-9]/g, ''))
  )
  if (partialMatch) return partialMatch
  
  return null
}

/**
 * HTML Tool Wrapper - Loads HTML tools via iframe
 */
const HTMLToolWrapper: React.FC<{ toolId: string; toolData: any }> = ({ toolId, toolData }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
  const iframeUrl = `${backendUrl}/api/tools/file/${toolId}?file_type=frontend`
  
  return (
    <div className="w-full h-full">
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0"
        style={{ minHeight: '100vh' }}
        title={toolData.name}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  )
}

/**
 * Load tool component dynamically by tool metadata
 * 
 * Loading strategies (in order):
 * 1. Pre-built components (auto-discovered from directory)
 * 2. HTML tools (iframe loader)
 * 3. Uploaded tools (dynamic iframe with shared dependencies)
 * 
 * For uploaded tools:
 * - Checks if built bundle exists
 * - Loads via DynamicIframeTool component
 * - Shares dependencies from parent app (React, lucide-react, etc)
 */
export const loadToolComponent = async (tool: any): Promise<ComponentType<any> | null> => {
  try {
    console.log('🔍 Loading tool component for:', tool.name)
    console.log('📦 Available React components:', Object.keys(DynamicToolRegistry))
    
    const frontendPath = tool.frontend_path || ''
    
    // 1. Check if tool uses HTML (static HTML file)
    if (frontendPath.endsWith('.html')) {
      console.log('📄 HTML tool detected, using iframe loader')
      return HTMLToolWrapper
    }
    
    // 2. Try to find matching pre-built component
    const componentName = findComponentNameForTool(tool.name)
    
    if (componentName && DynamicToolRegistry[componentName]) {
      console.log(`✅ Found pre-built component: ${componentName}`)
      
      // Load the React component dynamically
      const module = await DynamicToolRegistry[componentName]()
      return module.default
    }
    
    // 3. Check if this is an uploaded tool (not in pre-built registry)
    // Uploaded tools are stored in: tools/{category}/{slug}/frontend/
    const isUploadedTool = frontendPath.includes('tools/') && 
                          (frontendPath.endsWith('.tsx') || frontendPath.endsWith('.jsx'))
    
    if (isUploadedTool) {
      console.log('📦 Uploaded tool detected, using dynamic iframe loader')
      console.log('   Tool will load with shared dependencies from parent app')
      
      // Return DynamicIframeTool wrapper
      // This will be dynamically imported to avoid circular dependency
      return (await import('@/components/DynamicIframeTool')).default
    }
    
    // 4. No matching component found
    console.error('❌ No matching component found for tool:', tool.name)
    console.error('💡 Available components:', Object.keys(DynamicToolRegistry))
    console.error('💡 Frontend path:', frontendPath)
    console.error('💡 This tool may need to be built first')
    return null
    
  } catch (error) {
    console.error('❌ Failed to load tool component:', error)
    return null
  }
}

/**
 * Tool Component Wrapper
 * 
 * Wraps a tool component with error boundary and loading state
 */
export const ToolComponentWrapper: React.FC<{
  tool: any
  ToolComponent: ComponentType<any>
}> = ({ tool, ToolComponent }) => {
  return (
    <ToolErrorBoundary toolName={tool.name}>
      <Suspense fallback={<ToolLoadingFallback />}>
        <ToolComponent toolId={tool._id} toolData={tool} />
      </Suspense>
    </ToolErrorBoundary>
  )
}

/**
 * Register a tool component manually (for development)
 */
export const registerTool = (
  toolFilename: string,
  importFn: () => Promise<{ default: ComponentType<any> }>
) => {
  ToolRegistry[toolFilename] = importFn
}
