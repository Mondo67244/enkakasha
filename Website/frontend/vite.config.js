import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['wyatt-nonsingular-unhurriedly.ngrok-free.dev'],
    fs: {
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
})
