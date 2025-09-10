import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': '/src',
      '@/modules': '/src/modules',
      '@/components': '/src/components',
      '@/utils': '/src/utils'
    }
  },
  
  server: {
    port: 5173,
    host: true
  }
})

