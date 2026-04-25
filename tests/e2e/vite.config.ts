import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

// Standalone Vite config for the Playwright fixture. Aliases the package to
// `src/` so we exercise the same code the unit tests cover, without going
// through `pnpm build`.
export default defineConfig({
  root: resolve(__dirname, 'fixture'),
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@respeak\/lucide-motion-vue\/icons\/(.+)$/,
        replacement: resolve(ROOT, 'src/icons/$1.vue'),
      },
      {
        find: /^@respeak\/lucide-motion-vue$/,
        replacement: resolve(ROOT, 'src/index.ts'),
      },
    ],
  },
  server: {
    port: 5180,
    strictPort: true,
  },
})
