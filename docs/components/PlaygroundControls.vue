<script setup lang="ts">
import { ref, watch } from 'vue'
import type { IconAnimation, IconMeta } from '@respeak/lucide-motion-vue'

export type TriggerProp =
  | 'animateOnHover'
  | 'animateOnTap'
  | 'animateOnView'
  | 'animate'

const props = defineProps<{
  meta: IconMeta
  variant: IconAnimation
  trigger: TriggerProp
  size: number
  strokeWidth: number
  color: string | null
  persist: boolean
  clip: boolean
}>()

const emit = defineEmits<{
  (e: 'update:variant', v: IconAnimation): void
  (e: 'update:trigger', v: TriggerProp): void
  (e: 'update:size', v: number): void
  (e: 'update:strokeWidth', v: number): void
  (e: 'update:color', v: string | null): void
  (e: 'update:persist', v: boolean): void
  (e: 'update:clip', v: boolean): void
  (e: 'replay'): void
}>()

const swatches: Array<{ value: string | null; label: string }> = [
  { value: null,      label: 'Default' },
  { value: '#4f46e5', label: 'Indigo'  },
  { value: '#7c3aed', label: 'Violet'  },
  { value: '#ec4899', label: 'Pink'    },
  { value: '#ef4444', label: 'Red'     },
  { value: '#f59e0b', label: 'Amber'   },
  { value: '#10b981', label: 'Emerald' },
  { value: '#06b6d4', label: 'Cyan'    },
]

const custom = ref(props.color ?? '#4f46e5')

// Keep the <input type="color"> in sync when the parent flips the color
// via a swatch — otherwise the native picker would keep showing the old hue.
watch(
  () => props.color,
  c => { if (c) custom.value = c },
)

function pickSwatch(v: string | null) {
  emit('update:color', v)
}

function pickCustom(e: Event) {
  const v = (e.target as HTMLInputElement).value
  custom.value = v
  emit('update:color', v)
}
</script>

<template>
  <div class="pg-controls">
    <div class="pg-ctrl">
      <span class="pg-ctrl-label">Variant</span>
      <div class="variants">
        <button
          v-for="v in meta.animations"
          :key="v.name"
          type="button"
          class="pill"
          :class="{ active: v.name === variant.name }"
          @click="emit('update:variant', v)"
        >
          {{ v.name }}
        </button>
      </div>
    </div>

    <div class="pg-ctrl">
      <span class="pg-ctrl-label">Trigger</span>
      <select
        :value="trigger"
        @change="emit('update:trigger', ($event.target as HTMLSelectElement).value as TriggerProp)"
      >
        <option value="animateOnHover">animateOnHover</option>
        <option value="animateOnTap">animateOnTap</option>
        <option value="animateOnView">animateOnView</option>
        <option value="animate">animate (programmatic)</option>
      </select>
      <button
        v-if="trigger === 'animate'"
        type="button"
        class="pg-replay"
        title="Replay"
        @click="emit('replay')"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Replay
      </button>
    </div>

    <div class="pg-ctrl">
      <div class="pg-ctrl-head">
        <span class="pg-ctrl-label">Size</span>
        <code class="pg-value">{{ size }}px</code>
      </div>
      <input
        type="range"
        min="16"
        max="160"
        :value="size"
        @input="emit('update:size', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="pg-ctrl">
      <div class="pg-ctrl-head">
        <span class="pg-ctrl-label">Stroke width</span>
        <code class="pg-value">{{ strokeWidth }}</code>
      </div>
      <input
        type="range"
        min="0.5"
        max="4"
        step="0.25"
        :value="strokeWidth"
        @input="emit('update:strokeWidth', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="pg-ctrl">
      <span class="pg-ctrl-label">Color</span>
      <div class="pg-swatches">
        <button
          v-for="s in swatches"
          :key="String(s.value)"
          type="button"
          class="swatch"
          :class="{ active: color === s.value, reset: s.value === null }"
          :style="s.value ? { background: s.value } : undefined"
          :title="s.label"
          :aria-label="s.label"
          @click="pickSwatch(s.value)"
        />
      </div>
      <label class="pg-custom">
        <span>Custom</span>
        <input type="color" :value="custom" @input="pickCustom" />
      </label>
    </div>

    <label class="pg-check">
      <input
        type="checkbox"
        :checked="persist"
        @change="emit('update:persist', ($event.target as HTMLInputElement).checked)"
      />
      <span class="pg-check-main">
        <span class="pg-check-label">persistOnAnimateEnd</span>
        <span class="pg-check-hint">
          Stay on the final frame instead of snapping back to the start when
          the animation ends.
        </span>
      </span>
    </label>

    <label class="pg-check">
      <input
        type="checkbox"
        :checked="clip"
        @change="emit('update:clip', ($event.target as HTMLInputElement).checked)"
      />
      <span class="pg-check-main">
        <span class="pg-check-label">clip</span>
        <span class="pg-check-hint">
          Hide overflow at the icon's bounding box. Use for animations that
          move parts of the icon off-screen (e.g. <code>send</code>,
          <code>rocket</code>'s launch).
        </span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.pg-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.pg-ctrl {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pg-ctrl-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.pg-ctrl-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg-subtle);
  font-weight: 600;
}

.pg-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-muted);
  background: transparent;
  border: 0;
  padding: 0;
}

.pg-ctrl select {
  width: 100%;
  font: inherit;
  font-size: 0.85rem;
  padding: 7px 10px;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.pg-ctrl select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.pg-ctrl input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}

.pg-replay {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 0.8rem;
  padding: 5px 10px;
  background: transparent;
  color: var(--fg-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 140ms var(--ease-smooth);
}

.pg-replay:hover {
  color: var(--fg);
  border-color: var(--border-strong);
  background: var(--bg);
}

.variants {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pg-swatches {
  display: grid;
  /* min 32, max ~54 keeps tiles tidy in both the right-rail column (~240px
     effective width) and in the wide mobile breakpoint where the controls
     panel stretches. */
  grid-template-columns: repeat(4, minmax(32px, 54px));
  gap: 6px;
}

.pg-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--fg-muted);
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.pg-custom input[type='color'] {
  width: 44px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
}

.pg-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--fg);
  cursor: pointer;
}

.pg-check input {
  accent-color: var(--accent);
  margin-top: 3px;
  flex-shrink: 0;
}

.pg-check-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.pg-check-label {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--fg);
  line-height: 1.3;
}

.pg-check-hint {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--fg-muted);
  line-height: 1.45;
}
</style>
