import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// Résoudre les chemins vers Characters et elements
// En Docker: CHARACTERS_PATH=/Characters, ELEMENTS_PATH=/elements
// En local: chemins relatifs vers les dossiers du projet parent
const charactersPath = process.env.CHARACTERS_PATH || path.resolve(__dirname, '..', '..', '..', '..', 'Characters');
const elementsPath = process.env.ELEMENTS_PATH || path.resolve(__dirname, '..', '..', '..', '..', 'elements');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@characters': charactersPath,
      '@elements': elementsPath,
    },
  },
  server: {
    allowedHosts: ['wyatt-nonsingular-unhurriedly.ngrok-free.dev'],
    fs: {
      // Autoriser l'accès aux fichiers parents (nécessaire pour les imports ../../../../)
      allow: [
        path.resolve(__dirname, '..', '..'),
        charactersPath,
        elementsPath,
        '/',  // Racine pour Docker
      ],
      strict: false,
    },
  },
  build: {
    rollupOptions: {
      // Permettre à Rollup d'accéder aux fichiers externes pendant le build
      external: [],
    },
  },
})
