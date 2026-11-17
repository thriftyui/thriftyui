import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The tests: Vitest in jsdom, a browser emulated in Node, for every test
// file; React's plugin for JSX; each file's setup in vitest.setup.ts. A longer time limit than
// Vitest's default 5000ms (its `testTimeout`): a first axe-core scan can
// take more than that when every file runs at once.

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 15_000,
  },
})
