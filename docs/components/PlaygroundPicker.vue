<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import * as lib from '@respeak/lucide-motion-vue'
import { iconsMeta, type IconMeta } from '@respeak/lucide-motion-vue'

const props = defineProps<{ selected: IconMeta }>()
const emit = defineEmits<{ (e: 'select', m: IconMeta): void }>()

const query = ref('')
const searchEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const filtered = computed<IconMeta[]>(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return iconsMeta
  return iconsMeta.filter(
    m => m.kebab.includes(q) || m.pascal.toLowerCase().includes(q),
  )
})

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}

defineExpose({
  focus() {
    searchEl.value?.focus()
    searchEl.value?.select()
  },
})

// Keep the selected tile visible when the selection changes from outside
// (e.g. hash routing) so users aren't left hunting.
watch(
  () => props.selected.kebab,
  () => nextTick(scrollSelectedIntoView),
)

onMounted(() => {
  nextTick(scrollSelectedIntoView)
})

function scrollSelectedIntoView() {
  const host = listEl.value
  if (!host) return
  const el = host.querySelector<HTMLElement>(
    `[data-kebab="${props.selected.kebab}"]`,
  )
  if (!el) return
  const hostRect = host.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const pad = 12
  if (r.top < hostRect.top + pad) {
    host.scrollTop += r.top - hostRect.top - pad
  } else if (r.bottom > hostRect.bottom - pad) {
    host.scrollTop += r.bottom - hostRect.bottom + pad
  }
}
</script>

<template>
  <div class="pg-picker">
    <div class="pg-picker-search">
      <span class="icon-leading" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        ref="searchEl"
        v-model="query"
        type="search"
        :placeholder="`Search ${iconsMeta.length}…`"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div v-if="filtered.length === 0" class="pg-picker-empty">
      No matches.
    </div>

    <div v-else ref="listEl" class="pg-picker-list" role="listbox">
      <button
        v-for="m in filtered"
        :key="m.kebab"
        :data-kebab="m.kebab"
        class="pg-picker-tile"
        :class="{ active: m.kebab === selected.kebab }"
        role="option"
        :aria-selected="m.kebab === selected.kebab"
        :title="m.pascal"
        type="button"
        @click="emit('select', m)"
      >
        <component :is="resolveIcon(m.pascal)" :size="22" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pg-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.pg-picker-search {
  position: relative;
  flex-shrink: 0;
}

.pg-picker-search input {
  width: 100%;
  font: inherit;
  font-size: 0.88rem;
  padding: 9px 12px 9px 34px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--fg);
  border-radius: var(--radius-sm);
  transition: border-color 120ms, box-shadow 120ms;
}

.pg-picker-search input::placeholder { color: var(--fg-subtle); }

.pg-picker-search input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.pg-picker-search .icon-leading {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fg-subtle);
  pointer-events: none;
  display: flex;
}

.pg-picker-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 4px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}

.pg-picker-list::-webkit-scrollbar { width: 6px; }
.pg-picker-list::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}
.pg-picker-list::-webkit-scrollbar-track { background: transparent; }

.pg-picker-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--fg-muted);
  cursor: pointer;
  transition: all 140ms var(--ease-smooth);
  user-select: none;
  -webkit-user-select: none;
}

.pg-picker-tile:hover {
  background: var(--bg-elevated);
  color: var(--fg);
  border-color: var(--border);
}

.pg-picker-tile:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.pg-picker-tile.active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  color: var(--accent);
}

.pg-picker-empty {
  padding: 24px 8px;
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.85rem;
}
</style>
