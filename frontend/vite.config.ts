import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    proxy: {
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/bpm': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/chat': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  plugins: [
    
    
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      
      '@': path.resolve(__dirname, './src'),
    },
  },

  
  assetsInclude: ['***.csv'],
})
