<script setup lang="ts">
// SCRATCH audit page (dev only). One row per CSS-portable (icon, variant):
// the real lib component on the left, the generated CSS-only version on the
// right, so they can be compared by eye. Check the rows that look wrong and
// hit the floating button to copy their names — paste into a prompt to add
// them to the EXCLUDE list in scripts/build-css-exports.mjs.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as lib from '@respeak/lucide-motion-vue'
import { iconsMeta, AnimateIcon } from '@respeak/lucide-motion-vue'
import { cssExportStatus } from './generated/css-export-index'

type Row = { id: string; kebab: string; pascal: string; variant: string; status: string }

const rows: Row[] = []
for (const m of iconsMeta) {
  const vs = cssExportStatus[m.kebab] || {}
  for (const a of m.animations) {
    const st = vs[a.name]
    if (st === 'ok' || st === 'excluded') {
      rows.push({ id: `${m.kebab}|${a.name}`, kebab: m.kebab, pascal: m.pascal, variant: a.name, status: st })
    }
  }
}

const codes = ref<Record<string, string>>({})
const filter = ref('')
const checked = ref<Set<string>>(new Set())
const replayKeys = ref<Record<string, number>>({})

const filtered = computed(() => {
  const q = filter.value.toLowerCase().trim()
  if (!q) return rows
  return rows.filter(r => r.kebab.includes(q) || r.variant.includes(q))
})
const checkedList = computed(() => rows.filter(r => checked.value.has(r.id)))

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}
// The exported CSS plays one-shots on :hover; strip that so the row plays the
// animation on (re)mount, in sync with the lib side replaying via its key.
function cssCode(id: string) {
  const c = codes.value[id]
  return c ? c.replaceAll(':hover', '') : ''
}
function key(id: string) {
  return replayKeys.value[id] ?? 0
}
function replay(id: string) {
  replayKeys.value[id] = key(id) + 1
}
function replayAll() {
  for (const r of filtered.value) replay(r.id)
}
function toggle(id: string) {
  const next = new Set(checked.value)
  next.has(id) ? next.delete(id) : next.add(id)
  checked.value = next
}
async function copyChecked() {
  const text = checkedList.value.map(r => `${r.kebab}:${r.variant}`).join('\n')
  try { await navigator.clipboard.writeText(text) } catch { /* clipboard blocked */ }
}

// ---- keyboard review: ↑/↓ (or j/k) move · space replay · enter check ----
const activeIndex = ref(0)

// keep the cursor in range when the filter shrinks the list
watch(filtered, list => {
  if (activeIndex.value > list.length - 1) activeIndex.value = Math.max(0, list.length - 1)
})

function scrollActive() {
  nextTick(() => document.querySelector('.row.active')?.scrollIntoView({ block: 'nearest' }))
}

// Move the cursor to a row AND play it — entering a row replays both sides.
function activate(i: number) {
  activeIndex.value = i
  scrollActive()
  const r = filtered.value[i]
  if (r) replay(r.id)
}

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return // don't hijack the filter field
  const list = filtered.value
  if (!list.length) return
  switch (e.key) {
    case 'ArrowDown':
    case 'j':
      e.preventDefault()
      activate(Math.min(activeIndex.value + 1, list.length - 1))
      break
    case 'ArrowUp':
    case 'k':
      e.preventDefault()
      activate(Math.max(activeIndex.value - 1, 0))
      break
    case ' ':
      e.preventDefault()
      replay(list[activeIndex.value].id) // re-play current row without moving
      break
    case 'Enter':
      e.preventDefault()
      toggle(list[activeIndex.value].id)
      break
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  const res = await fetch(import.meta.env.BASE_URL + 'css-exports.json')
  codes.value = await res.json()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="wrap">
    <header>
      <h1>CSS export audit</h1>
      <p>{{ rows.length }} portable variants · lib (left) vs CSS-only (right). Check the ones that look wrong, then copy the names.</p>
      <p class="keys">
        <kbd>↑</kbd><kbd>↓</kbd> move + play · <kbd>space</kbd> replay · <kbd>enter</kbd> check
      </p>
      <div class="bar">
        <input v-model="filter" placeholder="filter by name…" />
        <button @click="replayAll">▶ replay visible</button>
        <span class="showing">{{ filtered.length }} shown</span>
      </div>
    </header>

    <div class="rows">
      <div
        v-for="(r, i) in filtered"
        :key="r.id"
        class="row"
        :class="{ checked: checked.has(r.id), active: i === activeIndex }"
        @click="activate(i)"
      >
        <label class="chk">
          <input type="checkbox" :checked="checked.has(r.id)" @change="toggle(r.id)" />
        </label>
        <div class="name">
          <b>{{ r.kebab }}</b>
          <span class="variant">{{ r.variant }}</span>
          <span v-if="r.status === 'excluded'" class="excluded">excluded</span>
        </div>
        <div class="cell">
          <span class="tag">lib</span>
          <AnimateIcon :key="`lib-${r.id}-${key(r.id)}`" :animate="r.variant" :animation="r.variant" as="template">
            <span class="ico"><component :is="resolveIcon(r.pascal)" :size="44" /></span>
          </AnimateIcon>
        </div>
        <div class="cell">
          <span class="tag">css</span>
          <div :key="`css-${r.id}-${key(r.id)}`" class="ico" v-html="cssCode(r.id)" />
        </div>
      </div>
    </div>

    <button v-if="checkedList.length" class="floating" @click="copyChecked">
      Copy {{ checkedList.length }} checked name{{ checkedList.length === 1 ? '' : 's' }}
    </button>
  </div>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px 120px; }
h1 { font-size: 20px; margin: 0 0 4px; }
header p { color: #9aa4b2; margin: 0 0 16px; }
.bar { display: flex; gap: 12px; align-items: center; position: sticky; top: 0; background: #0d1117; padding: 12px 0; z-index: 5; border-bottom: 1px solid #21262d; }
.bar input { background: #161b22; border: 1px solid #30363d; color: #e6edf3; border-radius: 8px; padding: 7px 12px; min-width: 240px; }
.bar button { background: #21262d; border: 1px solid #30363d; color: #e6edf3; border-radius: 8px; padding: 7px 12px; cursor: pointer; }
.showing { color: #9aa4b2; font-size: 12px; }
.keys { color: #8b949e; font-size: 12px; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
kbd { font: inherit; font-size: 11px; background: #21262d; border: 1px solid #30363d; border-bottom-width: 2px; border-radius: 5px; padding: 1px 6px; color: #e6edf3; }

.rows { margin-top: 12px; }
.row { display: grid; grid-template-columns: 36px minmax(220px, 1fr) 160px 160px; align-items: center; gap: 12px; padding: 10px 8px; border-bottom: 1px solid #1b2129; scroll-margin: 80px; }
.row.checked { background: rgba(248, 81, 73, 0.08); }
.row.active { box-shadow: inset 3px 0 0 #58a6ff; }
.row.active:not(.checked) { background: #11161d; }
.chk { display: flex; justify-content: center; }
.chk input { width: 18px; height: 18px; cursor: pointer; }
.name { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.name .variant { color: #9aa4b2; font-family: ui-monospace, monospace; font-size: 12px; }
.name .excluded { color: #f0883e; font-size: 11px; font-weight: 600; }

.cell { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; padding: 8px; border-radius: 10px; }
.cell:hover { background: #161b22; }
.cell .tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #6e7681; }
.ico { width: 44px; height: 44px; color: #e6edf3; display: inline-flex; align-items: center; justify-content: center; }
.ico :deep(svg) { width: 44px; height: 44px; }

.floating { position: fixed; right: 28px; bottom: 28px; background: #f85149; color: #fff; border: none; border-radius: 999px; padding: 14px 22px; font-size: 14px; font-weight: 650; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 10; }
.floating:hover { filter: brightness(1.08); }
</style>
