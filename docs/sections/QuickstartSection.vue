<script setup lang="ts">
import { Heart } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

const install = `$ pnpm add @respeak/lucide-motion-vue motion-v`

const usage = `<script setup lang="ts">
import { Heart } from '@respeak/lucide-motion-vue'
<\/script>

<template>
  <Heart animateOnHover :size="32" />
</template>`

const collisionSafe = `// Both libraries export \`Heart\` — use the \`Animated\` alias
// to keep the static and animated versions side-by-side.
import { Heart as StaticHeart } from 'lucide-vue-next'
import { HeartAnimated } from '@respeak/lucide-motion-vue'`

const subpath = `// Same component, imported via its subpath — guaranteed own chunk.
import Heart from '@respeak/lucide-motion-vue/icons/heart'
import BetweenVerticalStart from '@respeak/lucide-motion-vue/icons/between-vertical-start'`
</script>

<template>
  <section class="doc-section" id="quickstart">
    <h2>Quickstart</h2>
    <p>
      Every icon is a standalone Vue component. Drop one in, add a trigger prop
      — <code>animateOnHover</code>, <code>animateOnTap</code>, or
      <code>animateOnView</code> — and it animates. Color follows
      <code>currentColor</code>, so it inherits from any surrounding
      <code>color</code> style.
    </p>

    <h3>Install</h3>
    <CodeBlock :code="install" lang="bash" />
    <p class="muted">
      Peer deps: <code>vue ^3.3</code>, <code>motion-v ^2</code>.
    </p>

    <h3>Use</h3>
    <div class="doc-demo">
      <div class="demo-stage">
        <Heart animateOnHover :size="48" />
      </div>
      <CodeBlock :code="usage" lang="vue" />
    </div>
    <p class="muted">Hover the heart. One-shot: plays once per hover.</p>

    <h3>Collision-safe names</h3>
    <p>
      If you also use <code>lucide-vue-next</code> for static icons, both
      libraries export <code>Heart</code>, <code>Bell</code>,
      <code>User</code>, … Every icon here is <em>also</em> exported under its
      <code>&lt;Name&gt;Animated</code> alias so the two can coexist without
      rename-at-import gymnastics.
    </p>
    <CodeBlock :code="collisionSafe" lang="ts" />
    <p class="muted">
      Tree-shaking treats the alias and the short name as the same module —
      importing one doesn't duplicate the chunk.
    </p>

    <h3>Per-icon subpath imports</h3>
    <p>
      Every icon is exposed under <code>/icons/&lt;kebab-name&gt;</code> for
      consumers who want guaranteed separate chunks, or whose bundler
      struggles with large barrel files.
    </p>
    <CodeBlock :code="subpath" lang="ts" />
    <p class="muted">
      Tree-shaking works with either import style — the package is ESM and
      marked <code>&quot;sideEffects&quot;: false</code>, so unused icons are
      dropped. Use subpaths when you want the chunk graph to be predictable
      without relying on your bundler's barrel analysis.
    </p>
  </section>
</template>
