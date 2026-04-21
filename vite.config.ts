import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'

/**
 * Dual-purpose Vite config:
 *
 *   pnpm dev               → serve the /playground app. Aliases
 *                            `@respeak/lucide-motion-vue` to `src/`, so
 *                            edits hot-reload without a build step.
 *
 *   pnpm build             → library build via `build.lib`. Emits one chunk
 *                            per icon + one chunk for the shared core, so
 *                            per-icon subpath imports are tree-shakable.
 *                            Types are emitted by `vue-tsc` in the script.
 */
const ROOT = __dirname
const iconsDir = resolve(ROOT, 'src/icons')

const iconEntries = Object.fromEntries(
  readdirSync(iconsDir)
    .filter(f => f.endsWith('.vue'))
    .map(f => [`icons/${f.replace(/\.vue$/, '')}`, resolve(iconsDir, f)]),
)

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    root: isBuild ? ROOT : resolve(ROOT, 'playground'),
    publicDir: false,
    plugins: [vue(), ...(isBuild ? [] : [vuetify({ autoImport: true })])],
    resolve: {
      // Aliases run in order; first match wins. The subpath regex must
      // precede the bare-name alias because Vite's string aliases also
      // match as path prefixes (e.g. `foo` would catch `foo/bar` too).
      alias: isBuild
        ? []
        : [
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
    build: isBuild
      ? {
          outDir: resolve(ROOT, 'dist'),
          emptyOutDir: true,
          lib: {
            entry: {
              index: resolve(ROOT, 'src/index.ts'),
              ...iconEntries,
            },
            formats: ['es'],
          },
          rollupOptions: {
            external: ['vue', 'motion-v'],
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: 'chunks/[name]-[hash].js',
              preserveModules: false,
            },
          },
          sourcemap: true,
          minify: false,
        }
      : undefined,
  }
})
