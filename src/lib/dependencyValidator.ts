/**
 * Tool Dependencies Validator
 * 
 * Validates tool component imports against available shared dependencies
 * and provides helpful error messages for missing dependencies.
 */

import { AVAILABLE_DEPENDENCIES } from './sharedDependencies'

export interface DependencyCheckResult {
  isValid: boolean
  missingDependencies: string[]
  availableDependencies: string[]
  suggestions: string[]
}

/**
 * Extract import statements from tool component code
 */
export const extractImports = (code: string): string[] => {
  const importRegex = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g
  const imports: string[] = []
  let match

  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]
    // Only track external dependencies (not relative imports)
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // Get the package name (handle scoped packages)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0]
      imports.push(packageName)
    }
  }

  return [...new Set(imports)] // Remove duplicates
}

/**
 * Check if all imports are available in shared dependencies
 */
export const validateDependencies = (imports: string[]): DependencyCheckResult => {
  const available = Object.keys(AVAILABLE_DEPENDENCIES)
  const missing = imports.filter(imp => !available.includes(imp))
  
  const suggestions = missing.map(dep => {
    // Check if it's already in package.json but not exported
    return `To use "${dep}", add it to sharedDependencies.tsx and re-export it`
  })

  return {
    isValid: missing.length === 0,
    missingDependencies: missing,
    availableDependencies: available,
    suggestions
  }
}

/**
 * Format validation result as user-friendly message
 */
export const formatValidationMessage = (result: DependencyCheckResult): string => {
  if (result.isValid) {
    return '✅ All dependencies are available!'
  }

  let message = '⚠️ Missing Dependencies Detected:\n\n'
  
  result.missingDependencies.forEach(dep => {
    message += `❌ ${dep}\n`
  })

  message += '\n📦 Available Dependencies:\n'
  result.availableDependencies.forEach(dep => {
    message += `✅ ${dep}\n`
  })

  if (result.suggestions.length > 0) {
    message += '\n💡 Suggestions:\n'
    result.suggestions.forEach(suggestion => {
      message += `- ${suggestion}\n`
    })
  }

  return message
}

/**
 * Validate a tool component's dependencies
 */
export const validateToolDependencies = (componentCode: string): DependencyCheckResult => {
  const imports = extractImports(componentCode)
  return validateDependencies(imports)
}

/**
 * Display validation error in console
 */
export const logDependencyError = (toolName: string, result: DependencyCheckResult) => {
  console.group(`🔍 Dependency Check: ${toolName}`)
  console.error(formatValidationMessage(result))
  console.groupEnd()
}
