import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'axios-vendor': ['axios'],
          'animation-vendor': ['framer-motion'],
          'ui-vendor': ['react-hot-toast', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly for main chunk
    sourcemap: false, // Disable sourcemaps in production for smaller build
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'zustand', 'framer-motion', 'react-hot-toast'],
  },
})
