import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('./src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        content: path.resolve(__dirname, 'src/content/content.jsx'),
        background: path.resolve(__dirname, 'src/background.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Chrome content scripts are injected as classic scripts.
        // They CANNOT use ES module import statements.
        // Force ALL shared code into each entry point by preventing
        // Rollup from extracting common modules into separate chunks.
        manualChunks: () => undefined
      }
    },
    assetsInlineLimit: 0
  },
  base: './'
})
