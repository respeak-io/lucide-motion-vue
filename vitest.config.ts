import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@respeak\/lucide-motion-vue\/icons\/(.+)$/,
        replacement: resolve(__dirname, 'src/icons/$1.vue'),
      },
      {
        find: /^@respeak\/lucide-motion-vue$/,
        replacement: resolve(__dirname, 'src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.spec.ts'],
    // Playwright lives under tests/e2e and is run separately.
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
