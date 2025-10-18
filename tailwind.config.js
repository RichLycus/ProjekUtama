/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        dark: {
          background: '#1e1e2f',
          surface: '#2d2d3f',
          'surface-hover': '#363649',
          border: '#3e3e52',
          'border-light': '#505064',
        },
        // Light theme colors
        light: {
          background: '#ffffff',
          surface: '#ffffff',
          'surface-hover': '#f8f9fa',
          border: '#e5e7eb',
          'border-light': '#d1d5db',
        },
        // Common colors
        primary: '#007acc',
        secondary: '#0098ff',
        accent: '#00d4ff',
        
        // Category colors
        category: {
          office: '#007acc',
          devtools: '#8b5cf6',
          multimedia: '#f59e0b',
          utilities: '#10b981',
          security: '#ef4444',
          network: '#3b82f6',
          data: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #007acc, 0 0 10px #007acc' },
          '100%': { boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}