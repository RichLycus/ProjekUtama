import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Web-only config (without Electron) for testing in container
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    fs: {
      // Allow frontend_tools but exclude other backend files
      strict: false,  // ← Changed to false for universal paths!
      allow: [
        path.resolve(__dirname, '.'),  // ← Allow entire project root
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'backend'),  // ← Allow backend for frontend_tools access
      ]
    },
    watch: {
      // Watch frontend_tools for changes, ignore other backend files
      ignored: [
        '**/backend/!(frontend_tools)/**', 
        '**/backend/frontend_tools/**/*.py',  // Ignore Python files in frontend_tools
        '**/dist-electron/**', 
        '**/build/**', 
        '**/tests/**', 
        '**/release/**', 
        '**/docs/**', 
        '**/.git/**'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['electron'],
    entries: [
      'src/**/*.{ts,tsx}',
      'index.html'
    ]
  },
})
