import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'], // Force CommonJS
              fileName: () => 'preload.js',
            },
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },
    ]),
    renderer(),
    // Custom plugin to copy logo to dist
    {
      name: 'copy-logo',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const logoSrc = path.resolve(__dirname, 'public/logo-128.png')
        const logoDest = path.resolve(distDir, 'logo-128.png')
        
        if (existsSync(logoSrc) && existsSync(distDir)) {
          try {
            copyFileSync(logoSrc, logoDest)
            console.log('✅ Logo copied to dist/')
          } catch (e) {
            console.error('Failed to copy logo:', e)
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Exclude backend files from Vite scanning
      deny: [
        '**/backend/**',
      ],
      allow: [
        '.',
        'src',
        'public',
        'electron',
        'node_modules'
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep logo files in root of dist
          if (assetInfo.name === 'logo-128.png') {
            return 'logo-128.png'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})