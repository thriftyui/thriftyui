import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// React and Tailwind's Vite plugins (tailwindcss.com, Installation, "Using
// Vite"); the server as Tauri asks of it (tauri-docs, start/frontend/
// vite.mdx, "Update Vite configuration"): Rust's errors left on screen, a
// fixed port matching devUrl in src-tauri/tauri.conf.json, and src-tauri
// not watched. Its build target for Safari 13 is left out: Tailwind 4 needs
// Safari 16.4 or later (tailwindcss.com, Compatibility), and the app runs
// in macOS's own WebKit.
//
// Every Radix part the kit uses, and the packages the app and the site's
// blocks it shows import, pre-bundled when the server starts
// (`optimizeDeps.include`: "Force optimize listed dependencies", Vite's
// own DepOptimizationConfig). Found only when first imported, one would be
// bundled while the window ran, and the page reloaded mid-update with two
// copies of React ("Invalid hook call", seen 2026-10-17 twice). The Radix
// parts are read from the kit's sources, so the list keeps up with it.
const kitSrc = resolve(import.meta.dirname, '../../kit/src')
const radixParts = [
  ...new Set(
    readdirSync(kitSrc)
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) => [...readFileSync(resolve(kitSrc, f), 'utf8').matchAll(/from ['"](radix-ui\/[a-z-]+)['"]/g)].map((m) => m[1])),
  ),
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 5230,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  optimizeDeps: {
    include: [
      ...radixParts,
      'lucide-react',
      'tailwind-merge',
      'ghostty-web',
      'shiki/core',
      'shiki/engine/javascript',
      '@tauri-apps/api/core',
      '@tauri-apps/api/event',
      '@tauri-apps/api/webview',
      '@tauri-apps/plugin-dialog',
    ],
  },
})
