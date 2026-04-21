<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue'

const importSnippet = `import type { IconTriggerProps, IconMeta } from '@respeak/lucide-motion-vue'`

const wrapperSnippet = `import { defineComponent, h } from 'vue'
import { Heart, type IconTriggerProps } from '@respeak/lucide-motion-vue'

// A reusable favorite-badge component with fully typed props:
export default defineComponent<IconTriggerProps & { label: string }>({
  props: ['label'],
  setup(props, { slots }) {
    return () => h('span', { class: 'fav' }, [
      h(Heart, { size: 16, animateOnTap: 'fill' }),
      h('span', {}, props.label),
    ])
  },
})`

const metaSnippet = `import { iconsMeta, type IconMeta } from '@respeak/lucide-motion-vue'

// IconMeta = { kebab: string; pascal: string; animations: string[] }
const registry: Record<string, IconMeta> = Object.fromEntries(
  iconsMeta.map(m => [m.pascal, m])
)`
</script>

<template>
  <section class="doc-section" id="typescript">
    <h2>TypeScript</h2>
    <p>
      First-class. The package ships <code>.d.ts</code> alongside every chunk,
      so every icon has typed props
      (<code>size</code>, <code>strokeWidth</code>, <code>animate</code>,
      <code>animateOnHover</code>, …) and
      <code>&lt;AnimateIcon&gt;</code>'s <code>as</code> is a literal union.
      No <code>any</code> in the public API.
    </p>

    <h3>Public types</h3>
    <CodeBlock :code="importSnippet" lang="ts" />
    <ul class="doc-list">
      <li>
        <code>IconTriggerProps</code> — the shared prop set (size, strokeWidth,
        all triggers, animation). Extend it when building a typed wrapper
        around an icon.
      </li>
      <li>
        <code>IconMeta</code> —
        <code>{ kebab: string; pascal: string; animations: string[] }</code>.
        Returned from <code>iconsMeta</code> for each icon.
      </li>
    </ul>

    <h3>Extending an icon's props</h3>
    <p>
      <code>IconTriggerProps</code> is the canonical way to accept the same
      triggers as the underlying icons. Spread it into your own component's
      prop type to forward everything cleanly:
    </p>
    <CodeBlock :code="wrapperSnippet" lang="ts" />

    <h3>Typing icon metadata</h3>
    <CodeBlock :code="metaSnippet" lang="ts" />
    <p class="muted">
      See <a href="#/docs/variants">Variants</a> for a runtime demo of
      <code>iconsMeta</code>.
    </p>
  </section>
</template>
