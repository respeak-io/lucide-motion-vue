<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as lib from '@respeak/lucide-motion-vue'
import {
  AnimateIcon,
  ExternalLink,
  type IconAnimation,
  type IconMeta,
  type IconSource,
} from '@respeak/lucide-motion-vue'
import CodeBlock from './CodeBlock.vue'

const props = defineProps<{ meta: IconMeta }>()
defineEmits<{ (e: 'close'): void }>()

const selectedVariant = ref<IconAnimation>(
  props.meta.animations[0] ?? { name: 'default', source: 'animate-ui' },
)
const replayKey = ref(0)

watch(selectedVariant, () => replayKey.value++)
watch(
  () => props.meta,
  m => {
    selectedVariant.value = m.animations[0] ?? { name: 'default', source: 'animate-ui' }
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
  const name = selectedVariant.value.name
  const variantAttr = name === 'default' ? '' : `\n  animation="${name}"`
  return `<${props.meta.pascal}\n  animateOnHover${variantAttr}\n  :size="48"\n/>`
}

function importLine() {
  return `import { ${props.meta.pascal} } from '@respeak/lucide-motion-vue'`
}

const SOURCES: Record<IconSource, { label: string; href?: string }> = {
  'animate-ui': {
    label: 'animate-ui',
    href: 'https://github.com/imskyleen/animate-ui',
  },
  'lucide-animated': {
    label: 'lucide-animated',
    href: 'https://github.com/pqoqubbw/icons',
  },
  'hand-written': {
    label: 'hand-written',
  },
}

const activeSource = computed(() => SOURCES[selectedVariant.value.source])
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
          :key="selectedVariant.name + '-' + replayKey"
          :animate="selectedVariant.name"
          :animation="selectedVariant.name"
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
            :key="v.name"
            class="pill"
            :class="{ active: v.name === selectedVariant.name }"
            @click="selectedVariant = v"
          >
            {{ v.name }}
          </button>
        </div>
      </div>

      <!--
        "In context" — hover each sample to replay the currently-selected
        variant at a realistic size / surface. Size chips cover the three
        common UI scales; buttons show how the icon reads inside a solid
        and an outline shadcn-style button.
      -->
      <div class="section">
        <div class="section-label">In context</div>
        <div class="context-grid">
          <AnimateIcon
            v-for="size in [16, 24, 32]"
            :key="'ctx-size-' + size"
            :animation="selectedVariant.name"
            animateOnHover
            as="template"
            v-slot="{ on }"
          >
            <div class="ctx-size" v-on="on">
              <component :is="resolveIcon(meta.pascal)" :size="size" />
              <span class="ctx-size-label">{{ size }}</span>
            </div>
          </AnimateIcon>

          <span class="ctx-divider" aria-hidden="true" />

          <AnimateIcon
            :animation="selectedVariant.name"
            animateOnHover
            as="template"
            v-slot="{ on }"
          >
            <button class="ctx-btn ctx-btn-primary" type="button" v-on="on">
              <component :is="resolveIcon(meta.pascal)" :size="16" />
              <span>Button</span>
            </button>
          </AnimateIcon>

          <AnimateIcon
            :animation="selectedVariant.name"
            animateOnHover
            as="template"
            v-slot="{ on }"
          >
            <button
              class="ctx-btn ctx-btn-outline"
              type="button"
              aria-label="Icon button"
              v-on="on"
            >
              <component :is="resolveIcon(meta.pascal)" :size="16" />
            </button>
          </AnimateIcon>
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

      <!--
        Attribution for the currently-selected variant. Updates live when
        the user flips variants. The chip itself is the link when the
        source has an upstream repo; hand-written renders as a plain chip.
      -->
      <div class="section source-section">
        <div class="section-label">Source</div>
        <!--
          Wrap the <a> in AnimateIcon so the whole chip is the trigger — the
          ExternalLink icon then animates once per hover. Plain <span> path
          for hand-written (no repo to link to).
        -->
        <AnimateIcon
          v-if="activeSource.href"
          as="template"
          animateOnHover
          v-slot="{ on }"
        >
          <a
            class="source-tag source-tag-link"
            :data-source="selectedVariant.source"
            :href="activeSource.href"
            target="_blank"
            rel="noopener"
            v-on="on"
          >
            <svg
              class="source-tag-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.3-1.69-1.3-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.68 5.39-5.24 5.67.41.35.78 1.04.78 2.1v3.12c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/>
            </svg>
            {{ activeSource.label }}
            <ExternalLink :size="13" :strokeWidth="2.25" class="source-tag-ext" />
          </a>
        </AnimateIcon>
        <span
          v-else
          class="source-tag"
          :data-source="selectedVariant.source"
        >
          {{ activeSource.label }}
        </span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.context-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.ctx-size {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  color: var(--fg);
  border-radius: var(--radius-sm);
  cursor: default;
  transition: background 140ms var(--ease-smooth);
}
.ctx-size:hover { background: var(--bg); }

.ctx-size-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--fg-subtle);
  line-height: 1;
}

.ctx-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 2px;
}

.ctx-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 140ms var(--ease-smooth);
  white-space: nowrap;
}

.ctx-btn-primary {
  background: var(--fg);
  color: var(--bg);
  border: 1px solid var(--fg);
}
.ctx-btn-primary:hover { opacity: 0.9; }

.ctx-btn-outline {
  width: 36px;
  padding: 0;
  background: var(--bg-elevated);
  color: var(--fg);
  border: 1px solid var(--border-strong);
}
.ctx-btn-outline:hover {
  background: var(--bg);
  border-color: var(--fg-muted);
}

.source-section { margin-top: auto; }

.source-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--fg);
  text-decoration: none;
  transition: all 160ms var(--ease-smooth);
}
.source-tag-link:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}
.source-tag-icon,
.source-tag-ext { flex-shrink: 0; }
.source-tag-ext { opacity: 0.75; }

.source-tag[data-source='lucide-animated'] {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--accent);
}
.source-tag[data-source='animate-ui'] {
  background: color-mix(in srgb, #8b5cf6 12%, transparent);
  border-color: color-mix(in srgb, #8b5cf6 40%, transparent);
  color: #8b5cf6;
}
.source-tag[data-source='hand-written'] {
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  border-color: color-mix(in srgb, #f59e0b 40%, transparent);
  color: #f59e0b;
}
</style>
