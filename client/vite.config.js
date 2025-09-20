import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    // Enable code splitting and bundle optimization
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          markdown: ['marked'],
          mermaid: ['mermaid'],
          network: ['axios']
        }
      }
    },
    // Enable minification (esbuild is faster and included by default)
    minify: 'esbuild',
    // Generate source maps for production debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  // Enable performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})