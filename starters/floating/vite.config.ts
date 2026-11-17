import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// React and Tailwind's Vite plugins (tailwindcss.com, Installation, "Using
// Vite").
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
