import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// React and Tailwind's Vite plugins (tailwindcss.com, Installation, "Using
// Vite"). Two pages, which Chrome names in public/manifest.json: the
// popup and the side panel. `base: ''` writes their files' addresses
// relative, as an extension's pages load from its own folder.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '',
  build: {
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'popup.html'),
        sidepanel: resolve(import.meta.dirname, 'sidepanel.html'),
      },
    },
  },
})
