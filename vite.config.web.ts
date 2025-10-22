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
    port: 5173,
    fs: {
      // Exclude backend files from Vite scanning
      strict: false,
      allow: [
        '.'
      ]
    },
    watch: {
      ignored: ['**/backend/**', '**/dist-electron/**', '**/build/**', '**/tests/**', '**/release/**', '**/docs/**']
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  },
})
