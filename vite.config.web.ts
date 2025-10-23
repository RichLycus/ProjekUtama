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
      // Exclude backend files from Vite scanning
      strict: true,
      deny: ['**/backend/**', '**/.git/**'],
      allow: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'node_modules')
      ]
    },
    watch: {
      ignored: ['**/backend/**', '**/dist-electron/**', '**/build/**', '**/tests/**', '**/release/**', '**/docs/**', '**/.git/**']
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
