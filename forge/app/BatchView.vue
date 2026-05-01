<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BatchState, BatchSaveResult } from '../server/schema'
import {
  cancelBatch,
  getBatch,
  refineBatchRow,
  saveBatch,
  selectBatchRow,
  streamBatch,
  toggleSelection,
} from './api'
import type { Proposal } from '../server/schema'
import ProposalCard from './ProposalCard.vue'

const props = defineProps<{
  batchId: string
  loopMode: 'loop' | 'hover'
}>()

const emit = defineEmits<{
  close: []
}>()

const state = ref<BatchState | null>(null)
const error = ref<string | null>(null)
const saveResults = ref<BatchSaveResult[] | null>(null)
const saving = ref(false)
const cancelling = ref(false)

const rowRefs = ref<HTMLElement[]>([])
const activeRowIndex = ref(0)

let unsub: (() => void) | null = null
let observer: IntersectionObserver | null = null

onMounted(async () => {
  // Pull initial snapshot synchronously so the page isn't blank during the
  // SSE handshake.
  try {
    state.value = await getBatch(props.batchId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    return
  }
  unsub = streamBatch(
    props.batchId,
    s => {
      state.value = s
    },
    () => {
      // Stream errors are common at the end of life (server closes us when
      // the batch finalizes); only surface if we don't already have a
      // terminal state on hand.
      if (
        state.value &&
        state.value.status !== 'done' &&
        state.value.status !== 'cancelled' &&
        state.value.status !== 'error'
      ) {
        error.value = 'Stream disconnected. Refresh to reconnect.'
      }
    },
  )
  setupObserver()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  unsub?.()
  observer?.disconnect()
  window.removeEventListener('keydown', onKeydown)
})

watch(
  () => state.value?.rows.length ?? 0,
  async () => {
    await nextTick()
    setupObserver()
  },
)

function setupObserver() {
  observer?.disconnect()
  if (!rowRefs.value.length) return
  observer = new IntersectionObserver(
    entries => {
      // The most-centered visible row wins. `intersectionRatio` is enough to
      // pick the winner most of the time; if multiple rows are equally on
      // screen we fall back to the smallest index (top-most).
      let best: { index: number; ratio: number } | null = null
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const target = e.target as HTMLElement
        const idx = Number(target.dataset.rowIndex ?? -1)
        if (idx < 0) continue
        if (!best || e.intersectionRatio > best.ratio) {
          best = { index: idx, ratio: e.intersectionRatio }
        }
      }
      if (best) activeRowIndex.value = best.index
    },
    {
      rootMargin: '-40% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
  )
  for (const el of rowRefs.value) observer.observe(el)
}

const refining = ref<{ rowIndex: number; cardIndex: number } | null>(null)

function isRefining(rowIndex: number, cardIndex: number): boolean {
  if (refining.value?.rowIndex === rowIndex && refining.value?.cardIndex === cardIndex) {
    return true
  }
  const row = state.value?.rows[rowIndex]
  return row?.refiningCard === cardIndex
}

/**
 * `source` distinguishes how the selection was triggered:
 *   - 'keyboard' (1/2/3 hotkey): scroll to the next ready row, Typeform-style.
 *   - 'click' (mouse on a card): no auto-scroll. Reset focus to the clicked
 *     row instead — useful when the user reaches over to a different row
 *     than the one currently active.
 *
 * Selection is multi-pick: clicking a card adds it to the row's selection
 * list (preserving pick order); clicking it again removes it. The first
 * pick becomes the `default` variant when saved.
 */
async function onSelect(
  rowIndex: number,
  cardIndex: number,
  source: 'keyboard' | 'click',
) {
  const row = state.value?.rows[rowIndex]
  if (!row || row.status !== 'ready') return
  const next = toggleSelection(row.selectedIndices, cardIndex)
  const wasAdded = next.length > (row.selectedIndices?.length ?? 0)
  try {
    await selectBatchRow(props.batchId, rowIndex, next)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    return
  }
  if (wasAdded) {
    if (source === 'keyboard') {
      scrollToNextReadyRow(rowIndex)
    } else {
      activeRowIndex.value = rowIndex
    }
  }
}

async function onRefine(
  rowIndex: number,
  cardIndex: number,
  instruction: string,
) {
  refining.value = { rowIndex, cardIndex }
  try {
    await refineBatchRow(props.batchId, rowIndex, cardIndex, instruction)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    refining.value = null
  }
}

function scrollToNextReadyRow(fromIndex: number) {
  const rows = state.value?.rows ?? []
  for (let i = fromIndex + 1; i < rows.length; i++) {
    const el = rowRefs.value[i]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return
  // Ignore when typing in inputs.
  const target = ev.target as HTMLElement | null
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return
  }
  if (ev.key === '1' || ev.key === '2' || ev.key === '3') {
    const cardIdx = Number(ev.key) - 1
    const rowIdx = activeRowIndex.value
    const row = state.value?.rows[rowIdx]
    if (!row || row.status !== 'ready') return
    ev.preventDefault()
    void onSelect(rowIdx, cardIdx, 'keyboard')
  }
  if (ev.key === 'j' || ev.key === 'ArrowDown') {
    ev.preventDefault()
    scrollToNextReadyRow(activeRowIndex.value)
  }
  if (ev.key === 'k' || ev.key === 'ArrowUp') {
    ev.preventDefault()
    const idx = activeRowIndex.value
    if (idx > 0) rowRefs.value[idx - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const selectedCount = computed(
  () => state.value?.rows.filter(r => (r.selectedIndices?.length ?? 0) > 0).length ?? 0,
)

const totalSelectedFiles = computed(() => {
  // Every selected row writes one SFC (single-variant or multi-variant via
  // hand-templated merge or runtime <MultiVariantIcon>) — count is just the
  // number of rows with at least one pick.
  let total = 0
  for (const row of state.value?.rows ?? []) {
    if ((row.selectedIndices?.length ?? 0) > 0) total += 1
  }
  return total
})

/**
 * Client-side mirror of forge/server/sfc-writer.ts `areProposalsMergeCompatible`
 * — kept in sync structurally so the UI compatibility hint matches what the
 * server will actually do at save time.
 */
function areMergeCompatible(proposals: Proposal[]): boolean {
  if (proposals.length < 2) return true
  const ref = proposals[0]
  const SHAPE_ATTRS: Record<string, string[]> = {
    path: ['d'],
    line: ['x1', 'y1', 'x2', 'y2'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
    circle: ['cx', 'cy', 'r'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
    polyline: ['points'],
    polygon: ['points'],
  }
  for (let p = 1; p < proposals.length; p++) {
    const other = proposals[p]
    if (other.elements.length !== ref.elements.length) return false
    for (let i = 0; i < ref.elements.length; i++) {
      const a = ref.elements[i]
      const b = other.elements[i]
      if (a.tag !== b.tag) return false
      const keys = SHAPE_ATTRS[a.tag] ?? []
      for (const k of keys) {
        if (String(a.attrs?.[k] ?? '') !== String(b.attrs?.[k] ?? '')) return false
      }
      const ap = a.paths
      const bp = b.paths
      if ((ap?.length ?? 0) !== (bp?.length ?? 0)) return false
      for (let j = 0; j < (ap?.length ?? 0); j++) {
        if (ap![j] !== bp![j]) return false
      }
    }
  }
  return true
}

function variantNameForRank(rank: number): string {
  if (rank === 1) return 'default'
  if (rank === 2) return 'alt'
  return `alt-${rank - 1}`
}

function rowCompatibility(
  rowIndex: number,
): { kind: 'single' | 'merge' | 'merge-runtime'; count: number; variants: string[] } | null {
  const row = state.value?.rows[rowIndex]
  if (!row || !row.proposals) return null
  const indices = row.selectedIndices ?? []
  if (indices.length === 0) return null
  const variants = indices.map((_, i) => variantNameForRank(i + 1))
  if (indices.length === 1) return { kind: 'single', count: 1, variants }
  const proposals = indices.map(i => row.proposals![i])
  // Compatible silhouettes merge into one efficient hand-templated SFC.
  // Diverging silhouettes still merge into one file via <MultiVariantIcon>
  // — same public API for consumers, slightly heavier per-icon at runtime.
  return areMergeCompatible(proposals)
    ? { kind: 'merge', count: indices.length, variants }
    : { kind: 'merge-runtime', count: indices.length, variants }
}

function rankFor(row: BatchState['rows'][number], cardIndex: number): number | undefined {
  const at = row.selectedIndices?.indexOf(cardIndex) ?? -1
  return at >= 0 ? at + 1 : undefined
}
const readyCount = computed(
  () => state.value?.rows.filter(r => r.status === 'ready').length ?? 0,
)
const totalCost = computed(() => {
  const s = state.value
  if (!s) return 0
  return s.rankingCostUsd + s.generationCostUsd
})

const isLive = computed(() => {
  const st = state.value?.status
  return st === 'pending' || st === 'ranking' || st === 'generating'
})

function fmtCost(usd: number): string {
  if (usd < 0.001) return '<$0.001'
  if (usd < 0.01) return '$' + usd.toFixed(4)
  if (usd < 1) return '$' + usd.toFixed(3)
  return '$' + usd.toFixed(2)
}

async function onSaveSelected() {
  if (saving.value) return
  saving.value = true
  saveResults.value = null
  try {
    saveResults.value = await saveBatch(props.batchId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function onSaveRow(rowIndex: number) {
  saving.value = true
  try {
    const results = await saveBatch(props.batchId, [rowIndex])
    saveResults.value = [...(saveResults.value ?? []), ...results]
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function onCancel() {
  if (!isLive.value) return
  if (!confirm('Cancel batch? In-flight rows will finish; nothing further will start.')) {
    return
  }
  cancelling.value = true
  try {
    await cancelBatch(props.batchId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    cancelling.value = false
  }
}

function rowOutcome(rowIndex: number): BatchSaveResult | undefined {
  return saveResults.value?.find(r => r.rowIndex === rowIndex)
}

function setRowRef(el: Element | null, rowIndex: number) {
  if (!el) return
  const node = el as HTMLElement
  node.dataset.rowIndex = String(rowIndex)
  rowRefs.value[rowIndex] = node
}
</script>

<template>
  <div class="batch">
    <header class="bar">
      <div class="bar-left">
        <button class="back" @click="emit('close')">← Exit batch</button>
        <span class="status-pill" :class="state?.status">
          {{ state?.status ?? 'loading' }}
        </span>
        <span v-if="state" class="meta">
          {{ readyCount }} / {{ state.rows.length || state.n }} ready ·
          {{ selectedCount }} selected
        </span>
        <span v-if="state" class="cost">
          {{ fmtCost(totalCost) }}
        </span>
      </div>
      <div class="bar-right">
        <button
          v-if="isLive"
          class="ghost"
          :disabled="cancelling"
          @click="onCancel"
        >
          {{ cancelling ? 'Cancelling…' : 'Cancel batch' }}
        </button>
        <button
          class="primary"
          :disabled="saving || selectedCount === 0"
          @click="onSaveSelected"
        >
          {{ saving
            ? 'Saving…'
            : `Save ${selectedCount} row${selectedCount === 1 ? '' : 's'} (${totalSelectedFiles} file${totalSelectedFiles === 1 ? '' : 's'})` }}
        </button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="state && state.rows.length === 0 && !isLive" class="empty">
      No rows. {{ state.missingCount === 0 ? 'Library is fully covered.' : '' }}
    </div>

    <div class="rows">
      <section
        v-for="(row, i) in state?.rows ?? []"
        :key="i"
        :ref="(el) => setRowRef(el as Element | null, i)"
        class="row"
        :class="{ active: activeRowIndex === i, ready: row.status === 'ready' }"
      >
        <aside class="row-meta">
          <div class="row-num">{{ i + 1 }}</div>
          <div class="row-name">{{ row.iconName }}</div>
          <div class="row-reason">{{ row.reason }}</div>
          <div class="row-status">
            <span class="status-dot" :class="row.status"></span>
            <span>{{ row.status }}</span>
          </div>
          <div
            v-if="rowCompatibility(i)"
            class="compat-hint"
            :class="rowCompatibility(i)!.kind"
          >
            <template v-if="rowCompatibility(i)!.kind === 'single'">
              1 selected · default
            </template>
            <template v-else-if="rowCompatibility(i)!.kind === 'merge'">
              ✓ {{ rowCompatibility(i)!.count }} variants:
              {{ rowCompatibility(i)!.variants.join(', ') }}
            </template>
            <template v-else>
              ✓ {{ rowCompatibility(i)!.count }} variants (runtime):
              {{ rowCompatibility(i)!.variants.join(', ') }}
            </template>
          </div>
          <button
            v-if="row.status === 'ready' && (row.selectedIndices?.length ?? 0) > 0"
            class="row-save"
            :disabled="saving"
            @click="onSaveRow(i)"
          >
            Save row
          </button>
          <div v-if="rowOutcome(i)" class="row-outcome" :class="rowOutcome(i)!.outcome.kind">
            <template v-if="rowOutcome(i)!.outcome.kind === 'written'">
              <template v-if="(rowOutcome(i)!.outcome as { merged: boolean }).merged">
                ✓ merged ({{ (rowOutcome(i)!.outcome as { files: { variants: string[] }[] }).files[0].variants.join(', ') }})
              </template>
              <template v-else-if="(rowOutcome(i)!.outcome as { files: unknown[] }).files.length > 1">
                ✓ wrote {{ (rowOutcome(i)!.outcome as { files: unknown[] }).files.length }} files
              </template>
              <template v-else>
                ✓ written
              </template>
            </template>
            <template v-else-if="rowOutcome(i)!.outcome.kind === 'conflict'">
              ⚠ conflict
            </template>
            <template v-else-if="rowOutcome(i)!.outcome.kind === 'failed'">
              ✗ failed
            </template>
            <template v-else>
              skipped
            </template>
          </div>
          <p v-if="row.error" class="row-error">{{ row.error }}</p>
        </aside>

        <div class="cards">
          <template v-if="row.status === 'ready' && row.proposals && row.verdicts">
            <ProposalCard
              v-for="(proposal, c) in row.proposals"
              :key="c"
              :proposal="proposal"
              :verdict="row.verdicts[c]"
              :index="c"
              :selected="(row.selectedIndices ?? []).includes(c)"
              :selection-rank="rankFor(row, c)"
              :variant-name="rankFor(row, c) ? variantNameForRank(rankFor(row, c)!) : undefined"
              :refining="isRefining(i, c)"
              :loop-mode="loopMode"
              @select="onSelect(i, $event, 'click')"
              @refine="(_idx, instruction) => onRefine(i, c, instruction)"
            />
          </template>
          <template v-else>
            <div v-for="c in 3" :key="c" class="card-skeleton">
              <div class="skel-spinner"></div>
              <span>{{ row.status }}…</span>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.batch {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #eee;
}
.bar-left, .bar-right {
  display: flex; align-items: center; gap: 12px;
}
.back {
  background: transparent; border: none; cursor: pointer;
  font-size: 13px; color: #555; padding: 4px 8px;
}
.back:hover { color: #111; }

.status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #eee;
  color: #555;
}
.status-pill.ranking { background: #fef3c7; color: #92400e; }
.status-pill.generating { background: #dbeafe; color: #1e40af; }
.status-pill.done { background: #dcfce7; color: #166534; }
.status-pill.cancelled { background: #fee2e2; color: #991b1b; }
.status-pill.error { background: #fee2e2; color: #991b1b; }

.meta { font-size: 13px; color: #555; }
.cost {
  font-size: 13px; font-variant-numeric: tabular-nums;
  font-weight: 600; color: #111;
}

.primary, .ghost {
  font-size: 13px; padding: 6px 14px; border-radius: 6px; cursor: pointer;
  font-family: inherit; font-weight: 500;
}
.primary {
  background: #2563eb; color: white; border: none;
}
.primary:hover:not(:disabled) { background: #1d4ed8; }
.primary:disabled { opacity: 0.4; cursor: not-allowed; }
.ghost {
  background: transparent; color: #555; border: 1px solid #ddd;
}
.ghost:hover:not(:disabled) { background: #f5f5f5; }
.ghost:disabled { opacity: 0.5; cursor: not-allowed; }

.error {
  margin: 12px 24px;
  padding: 10px 14px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  font-size: 13px;
}
.empty {
  margin: 60px auto;
  font-size: 14px;
  color: #777;
}

.rows {
  display: flex;
  flex-direction: column;
  padding: 16px 24px 60vh;
  gap: 12px;
}

.row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  padding: 24px;
  border: 2px solid #eee;
  border-radius: 14px;
  background: white;
  scroll-margin: 24px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.row.active {
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}
.row.ready { /* placeholder for future visual diff */ }

.row-meta {
  display: flex; flex-direction: column; gap: 8px;
}
.row-num {
  font-size: 11px; color: #888; font-variant-numeric: tabular-nums;
}
.row-name {
  font-size: 18px; font-weight: 600; word-break: break-word;
}
.row-reason {
  font-size: 13px; color: #555; line-height: 1.4;
}
.row-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #555; text-transform: capitalize;
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #ccc;
  display: inline-block;
}
.status-dot.fetching { background: #fbbf24; }
.status-dot.generating { background: #60a5fa; animation: pulse 1.4s ease-in-out infinite; }
.status-dot.ready { background: #22c55e; }
.status-dot.failed { background: #ef4444; }
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.compat-hint {
  margin-top: 4px;
  align-self: flex-start;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}
.compat-hint.single { background: #f3f4f6; color: #555; }
.compat-hint.merge { background: #dcfce7; color: #166534; }
.compat-hint.merge-runtime { background: #ecfdf5; color: #065f46; }

.row-save {
  margin-top: 4px;
  align-self: flex-start;
  background: white; color: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 6px;
  padding: 5px 12px; font-size: 12px; font-weight: 500;
  cursor: pointer; font-family: inherit;
}
.row-save:hover:not(:disabled) { background: #eff6ff; }
.row-save:disabled { opacity: 0.4; cursor: not-allowed; }

.row-outcome {
  margin-top: 4px;
  font-size: 12px; font-weight: 500;
  align-self: flex-start;
  padding: 3px 8px; border-radius: 4px;
}
.row-outcome.written { background: #dcfce7; color: #166534; }
.row-outcome.conflict { background: #fef3c7; color: #92400e; }
.row-outcome.failed { background: #fee2e2; color: #991b1b; }
.row-outcome.skipped { background: #f3f4f6; color: #555; }

.row-error {
  margin: 6px 0 0;
  font-size: 12px; color: #991b1b;
  background: #fef2f2; padding: 6px 8px; border-radius: 6px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  min-width: 0;
}

.card-skeleton {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; min-height: 240px;
  border: 2px dashed #e5e5e5;
  border-radius: 16px;
  background: #fafafa;
  font-size: 12px;
  color: #888;
  text-transform: capitalize;
}
.skel-spinner {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 3px solid #e5e5e5;
  border-top-color: #888;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
