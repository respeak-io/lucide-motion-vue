import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * Docs-site build. Separate from `vite.config.ts` so the library build and
 * the docs build don't have to share flags.
 *
 * Dev:    pnpm docs:dev        (http://localhost:5174)
 * Build:  pnpm docs:build      (static output in docs-dist/)
 * Deploy: GitHub Pages serves docs-dist/ at a subpath; pass VITE_DOCS_BASE.
 */
const ROOT = __dirname

export default defineConfig({
  root: resolve(ROOT, 'docs'),
  base: process.env.VITE_DOCS_BASE || '/',
  plugins: [vue()],
  server: { port: 5174 },
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
  build: {
    outDir: resolve(ROOT, 'docs-dist'),
    emptyOutDir: true,
  },
})
