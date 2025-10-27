/**
 * Dynamic Tool Component Loader (Auto-Discovery System)
 * 
 * This system automatically discovers and loads tools as native React components
 * with full access to main app dependencies (lucide-react, Tailwind, etc.)
 * 
 * NO MANUAL REGISTRATION NEEDED! 🎉
 * Tools are auto-discovered from /app/src/components/tools/dynamic/ directory
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
 * Auto-discover all tool components using Vite's glob import
 * 
 * This automatically imports ALL .tsx files from the tools/dynamic directory
 * Vite will create separate chunks for code splitting
 */
const toolModules = import.meta.glob('../components/tools/dynamic/*.tsx')

console.log('🔍 Auto-discovered tool modules:', Object.keys(toolModules))

/**
 * Build dynamic registry from discovered modules
 * Maps tool component names to their import functions
 */
const buildDynamicRegistry = () => {
  const registry: Record<string, () => Promise<{ default: ComponentType<any> }>> = {}
  
  Object.keys(toolModules).forEach((path) => {
    // Extract component name from path
    // Example: '../components/tools/dynamic/GreetingSpeaker.tsx' -> 'GreetingSpeaker'
    const match = path.match(/\/([^/]+)\.tsx$/)
    if (match) {
      const componentName = match[1]
      registry[componentName] = toolModules[path] as () => Promise<{ default: ComponentType<any> }>
      
      console.log(`✓ Registered tool component: ${componentName}`)
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
  // Map tool display names to component names
  'Sapaan Login/Shutdown': 'GreetingSpeaker',
  'Image Scaling Tool (4K Upscaler)': 'ImageUpscaler',
  
  // Add mappings here if tool name != component filename
  // Format: 'Tool Display Name': 'ComponentFileName'
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
 * Load tool component dynamically by tool metadata
 * 
 * AUTO-DISCOVERS components from directory - NO MANUAL REGISTRATION! 🎉
 * 
 * Matching strategies (in order):
 * 1. Direct name mapping (ToolNameMappings)
 * 2. Exact component name match
 * 3. PascalCase conversion of tool name
 * 4. Kebab-case variations
 * 5. Partial/fuzzy match
 */
export const loadToolComponent = async (tool: any): Promise<ComponentType<any> | null> => {
  try {
    console.log('🔍 Loading tool component for:', tool.name)
    console.log('📦 Available components:', Object.keys(DynamicToolRegistry))
    
    // Find matching component name
    const componentName = findComponentNameForTool(tool.name)
    
    if (!componentName) {
      console.error('❌ No matching component found for tool:', tool.name)
      console.error('💡 Available components:', Object.keys(DynamicToolRegistry))
      console.error('💡 Add mapping to ToolNameMappings if needed')
      return null
    }
    
    console.log(`✅ Matched to component: ${componentName}`)
    
    // Load the component dynamically
    const module = await DynamicToolRegistry[componentName]()
    return module.default
    
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
