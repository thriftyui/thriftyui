import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Tailwind through its Vite plugin: tailwindcss.com, Installation, "Using
// Vite", step 3 (README, Sources).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
