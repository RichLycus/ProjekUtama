/**
 * Dependency Bridge - Shared Context for Dynamic Tool Components
 * 
 * This module exposes main app dependencies to dynamically loaded tools via iframe.
 * Tools can access React, lucide-react, Tailwind, and other shared libraries
 * without bundling them separately.
 * 
 * Architecture:
 * 1. Parent app exposes dependencies via window.__APP_CTX__
 * 2. Iframe tools import from parent context instead of bundling
 * 3. PostMessage communication for tool execution & events
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import * as LucideReact from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Shared App Context - Available to all iframe tools
 */
export interface AppDependencyContext {
  // Core React
  React: typeof React
  ReactDOM: typeof ReactDOM
  
  // UI Libraries
  LucideReact: typeof LucideReact
  motion: typeof motion
  AnimatePresence: typeof AnimatePresence
  
  // Utility functions
  fetch: typeof fetch
  
  // Backend URL for API calls
  backendUrl: string
  
  // Tool communication
  postMessage: (type: string, payload: any) => void
}

/**
 * Initialize dependency bridge on parent app
 * Call this once in main App.tsx
 */
export function initializeDependencyBridge() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001'
  
  const context: AppDependencyContext = {
    React,
    ReactDOM,
    LucideReact,
    motion,
    AnimatePresence,
    fetch: window.fetch.bind(window),
    backendUrl,
    postMessage: (type: string, payload: any) => {
      // Tools can use this to communicate with parent
      window.parent.postMessage({ type, payload, source: 'tool' }, '*')
    }
  }
  
  // Expose to window for iframe tools
  ;(window as any).__APP_CTX__ = context
  
  console.log('✅ Dependency Bridge initialized')
  console.log('📦 Available dependencies:', Object.keys(context))
}

/**
 * Get dependency context (for parent app)
 */
export function getDependencyContext(): AppDependencyContext {
  return (window as any).__APP_CTX__
}

/**
 * Check if running inside iframe tool
 */
export function isIframeTool(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true // Cross-origin iframe
  }
}

/**
 * Get parent context from iframe
 */
export function getParentContext(): AppDependencyContext | null {
  if (!isIframeTool()) {
    console.warn('Not running in iframe - cannot access parent context')
    return null
  }
  
  try {
    return (window.parent as any).__APP_CTX__
  } catch {
    console.error('Cannot access parent context - cross-origin issue?')
    return null
  }
}
