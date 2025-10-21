import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuration pour la production
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          grapesjs: ['grapesjs']
        }
      }
    }
  },
  
  // Configuration du serveur de développement
  server: {
    port: 3000,
    host: true, // Permet l'accès depuis l'extérieur
    cors: true
  },
  
  // Variables d'environnement
  define: {
    'process.env': process.env
  }
})
