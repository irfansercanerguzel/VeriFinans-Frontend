import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Bunu ekle

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Bunu da buraya ekle
  ],
})