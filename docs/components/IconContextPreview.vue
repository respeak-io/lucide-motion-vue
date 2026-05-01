<script setup lang="ts">
import * as lib from '@respeak/lucide-motion-vue'
import { AnimateIcon, type IconMeta } from '@respeak/lucide-motion-vue'

defineProps<{ meta: IconMeta; variantName: string }>()

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}
</script>

<template>
  <div class="context-grid">
    <AnimateIcon
      v-for="size in [16, 24, 32]"
      :key="'ctx-size-' + size"
      :animation="variantName"
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
      :animation="variantName"
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
      :animation="variantName"
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
</style>
