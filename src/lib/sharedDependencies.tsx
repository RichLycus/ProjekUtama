/**
 * Shared Dependencies for Dynamic Tool Components
 * 
 * This module exports all common dependencies used by tool components.
 * Tool components MUST import from this file instead of direct node_modules
 * to ensure they share the same module context as the main app.
 * 
 * BENEFITS:
 * - Single source of truth for all dependencies
 * - No duplicate module instances
 * - Consistent versions across main app and tools
 * - Easier to track what dependencies are available
 * 
 * USAGE IN TOOL COMPONENTS:
 * ```tsx
 * // ❌ DON'T: Import directly from node_modules
 * import { Upload, Download } from 'lucide-react'
 * 
 * // ✅ DO: Import from shared dependencies
 * import { lucideIcons } from '@/lib/sharedDependencies'
 * const { Upload, Download } = lucideIcons
 * ```
 */

// Re-export React and hooks
export { default as React, useState, useEffect, useMemo, useCallback, useRef } from 'react'
export type { FC, ComponentType, ReactNode, CSSProperties } from 'react'

// Re-export all lucide-react icons
export * as lucideIcons from 'lucide-react'

// Re-export commonly used libraries
export { default as axios } from 'axios'
export { default as clsx } from 'clsx'
export { twMerge } from 'tailwind-merge'
export { motion, AnimatePresence } from 'framer-motion'
export { toast } from 'react-hot-toast'
export { useNavigate, useParams, useLocation, Link } from 'react-router-dom'

// Re-export date utilities
export { format, formatDistanceToNow, parseISO } from 'date-fns'

// Utility function to combine classnames (commonly used pattern)
export const cn = (...inputs: any[]) => {
  return twMerge(clsx(inputs))
}

// Backend URL helper
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'

/**
 * Available Dependencies List
 * Used for validation and documentation
 */
export const AVAILABLE_DEPENDENCIES = {
  'react': 'React core library',
  'lucide-react': 'Icon library (all icons available via lucideIcons.*)',
  'axios': 'HTTP client',
  'clsx': 'Conditional classnames utility',
  'tailwind-merge': 'Tailwind class merging utility',
  'framer-motion': 'Animation library',
  'react-hot-toast': 'Toast notifications',
  'react-router-dom': 'Routing library',
  'date-fns': 'Date utilities'
} as const

/**
 * Check if a dependency is available
 */
export const isDependencyAvailable = (depName: string): boolean => {
  return depName in AVAILABLE_DEPENDENCIES
}

/**
 * Get list of all available dependencies
 */
export const getAvailableDependencies = () => {
  return Object.entries(AVAILABLE_DEPENDENCIES).map(([name, description]) => ({
    name,
    description
  }))
}
