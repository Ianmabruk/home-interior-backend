import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/server/**',
      '**/backend/**',
      '**/tests/**',
      '**/*.spec.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/setup.js', 'server/**', 'backend/**', 'tests/**'],
    },
  },
})
