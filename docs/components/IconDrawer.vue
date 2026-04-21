<script setup lang="ts">
import { ref, watch } from 'vue'
import * as lib from '@respeak/lucide-motion-vue'
import { AnimateIcon, type IconMeta } from '@respeak/lucide-motion-vue'
import CodeBlock from './CodeBlock.vue'

const props = defineProps<{ meta: IconMeta }>()
defineEmits<{ (e: 'close'): void }>()

const selectedVariant = ref(props.meta.animations[0] ?? 'default')
const replayKey = ref(0)

watch(selectedVariant, () => replayKey.value++)
watch(
  () => props.meta,
  m => {
    selectedVariant.value = m.animations[0] ?? 'default'
    replayKey.value++
  },
)

function replay() {
  replayKey.value++
}

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}

function snippet() {
  const variantAttr = selectedVariant.value === 'default' ? '' : `\n  animation="${selectedVariant.value}"`
  return `<${props.meta.pascal}\n  animateOnHover${variantAttr}\n  :size="48"\n/>`
}

function importLine() {
  return `import { ${props.meta.pascal} } from '@respeak/lucide-motion-vue'`
}
</script>

<template>
  <div class="drawer-backdrop" @click="$emit('close')" />
  <aside class="drawer" role="dialog" aria-modal="true">
    <div class="head">
      <div class="head-meta">
        <h2>{{ meta.pascal }}</h2>
        <span class="kebab">{{ meta.kebab }}</span>
      </div>
      <button class="icon-btn" @click="$emit('close')" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
    </div>

    <div class="body">
      <div class="preview">
        <!--
          Single replay control (↻). Hover/click on the SVG itself is
          inert so the selection box doesn't appear. The animation replays
          on mount and whenever `replayKey` / `selectedVariant` change.
          Icons that bake `repeat: Infinity` into their variants loop on
          their own; others play once per trigger.
        -->
        <div class="preview-controls">
          <span />
          <button class="ctrl" title="Replay" @click="replay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>

        <AnimateIcon
          :key="selectedVariant + '-' + replayKey"
          :animate="selectedVariant"
          :animation="selectedVariant"
          as="template"
        >
          <div class="preview-stage">
            <component :is="resolveIcon(meta.pascal)" :size="112" />
          </div>
        </AnimateIcon>
      </div>

      <div class="section">
        <div class="section-label">Variants ({{ meta.animations.length }})</div>
        <div class="variants">
          <button
            v-for="v in meta.animations"
            :key="v"
            class="pill"
            :class="{ active: v === selectedVariant }"
            @click="selectedVariant = v"
          >
            {{ v }}
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Usage</div>
        <CodeBlock :code="snippet()" lang="vue" />
      </div>

      <div class="section">
        <div class="section-label">Import</div>
        <CodeBlock :code="importLine()" lang="ts" />
      </div>
    </div>
  </aside>
</template>
