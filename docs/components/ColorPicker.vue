<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { AnimateIcon, Paintbrush } from '@respeak/lucide-motion-vue'

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>()

const open = ref(false)
const btnEl = ref<HTMLButtonElement | null>(null)
const popEl = ref<HTMLDivElement | null>(null)

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

function pick(c: string | null) {
  emit('update:modelValue', c)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (popEl.value?.contains(t) || btnEl.value?.contains(t)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div class="color-wrap">
    <AnimateIcon animateOnHover animateOnTap as="template" v-slot="{ on }">
      <button
        ref="btnEl"
        class="icon-btn"
        :class="{ active: open }"
        title="Icon color"
        aria-label="Icon color"
        :aria-expanded="open"
        v-on="on"
        @click="open = !open"
      >
        <Paintbrush :size="18" />
        <span
          class="color-dot"
          :style="{ background: props.modelValue ?? 'var(--fg)' }"
          aria-hidden="true"
        />
      </button>
    </AnimateIcon>
    <div v-if="open" ref="popEl" class="color-pop" role="dialog" aria-label="Pick icon color">
      <div class="swatches">
        <button
          v-for="s in swatches"
          :key="String(s.value)"
          class="swatch"
          :class="{ active: props.modelValue === s.value, reset: s.value === null }"
          :style="s.value ? { background: s.value } : undefined"
          :title="s.label"
          :aria-label="s.label"
          @click="pick(s.value)"
        />
      </div>
      <label class="custom-color">
        <span>Custom</span>
        <input
          type="color"
          :value="props.modelValue ?? '#4f46e5'"
          @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </div>
</template>
