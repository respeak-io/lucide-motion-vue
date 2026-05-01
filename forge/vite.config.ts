import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { forgeApiPlugin } from './server/api-plugin'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

export default defineConfig({
  root: HERE,
  plugins: [vue(), forgeApiPlugin()],
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    // Reuse the parent repo's vue + motion-v installs so generated previews
    // render with the exact runtime the library ships against.
    alias: {
      '@respeak/lucide-motion-vue': resolve(REPO_ROOT, 'src/index.ts'),
    },
  },
})
