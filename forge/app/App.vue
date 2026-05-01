<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  generate,
  refine,
  select,
  exportProposal,
  estimateBatch,
  startBatch,
  listBatches,
  type BatchEstimate,
} from './api'
import type { ModelTier, RunResult, BatchListEntry } from '../server/schema'
import ProposalCard from './ProposalCard.vue'
import BatchView from './BatchView.vue'

const iconName = ref('wand-sparkles')
const loading = ref(false)
const loadingTier = ref<ModelTier>('sonnet')
const error = ref<string | null>(null)

const currentIcon = ref<string | null>(null)
const sourceSvg = ref<string>('')
const runs = ref<RunResult[]>([])

const selected = ref<{ runIndex: number; cardIndex: number } | null>(null)
const refining = ref<{ runIndex: number; cardIndex: number } | null>(null)

const loopMode = ref<'loop' | 'hover'>('loop')
const sessionCostUsd = ref(0)

// Capability flags — both off by default so existing behavior is unchanged.
// Tick on per run when you want Claude to spawn aux particles or morph paths.
const allowSpawning = ref(false)
const allowMorphing = ref(false)

const saving = ref(false)
const exporting = ref(false)
const savedFilePath = ref<string | null>(null)
const exportedFilePath = ref<string | null>(null)
const conflict = ref<{ existingFile: string; existingVariants: string[] } | null>(null)

const elapsed = ref(0)
let timer: number | undefined

// Rotating status so it's clear the request is alive, not stuck.
const STATUS_BEATS = [
  'Reading the style guide…',
  'Studying the source SVG…',
  'Sketching distinct concepts…',
  'Wiring variants and timings…',
  'Tightening keyframes…',
  'Almost there — final review…',
]
const status = computed(() => {
  const beatLen = loadingTier.value === 'opus' ? 18 : 10
  const idx = Math.min(
    Math.floor(elapsed.value / beatLen),
    STATUS_BEATS.length - 1,
  )
  return STATUS_BEATS[idx]
})
const loaderMeta = computed(() => {
  if (loadingTier.value === 'opus') {
    return `${elapsed.value}s elapsed · Opus 4.7 + xhigh effort + 40K task budget · typically 60–120s`
  }
  return `${elapsed.value}s elapsed · Sonnet 4.6 + adaptive thinking · typically 30–60s`
})

function startTimer() {
  elapsed.value = 0
  timer = window.setInterval(() => { elapsed.value++ }, 1000)
}
function stopTimer() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}
onUnmounted(stopTimer)

const hasOpusRun = computed(() => runs.value.some(r => r.tier === 'opus'))
const totalCostForCurrentIcon = computed(() =>
  runs.value.reduce((sum, r) => sum + r.cost.total_usd, 0),
)

function fmtCost(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.001) return '<$0.001'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  if (usd < 1) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

async function runGenerate(tier: ModelTier) {
  loading.value = true
  loadingTier.value = tier
  error.value = null
  selected.value = null
  refining.value = null
  clearSaveState()

  // Fresh icon (or first run on this icon): clear prior runs.
  // Manual Opus regen on the current icon: keep Sonnet runs visible.
  const isFreshIcon = currentIcon.value !== iconName.value.trim()
  if (isFreshIcon || tier === 'sonnet') {
    runs.value = []
    sourceSvg.value = ''
  }

  startTimer()
  try {
    const res = await generate(iconName.value.trim(), tier, {
      allowSpawning: allowSpawning.value,
      allowMorphing: allowMorphing.value,
    })
    currentIcon.value = res.iconName
    sourceSvg.value = res.sourceSvg
    runs.value = [...runs.value, ...res.runs]
    // Track session-wide spend across all calls.
    for (const r of res.runs) sessionCostUsd.value += r.cost.total_usd
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
    stopTimer()
  }
}

function onGenerate() { runGenerate('sonnet') }
function onRegenerateWithOpus() { runGenerate('opus') }

function clearSaveState() {
  savedFilePath.value = null
  exportedFilePath.value = null
  conflict.value = null
}

function onSelect(runIndex: number, cardIndex: number) {
  if (
    selected.value?.runIndex === runIndex &&
    selected.value?.cardIndex === cardIndex
  ) {
    selected.value = null
  } else {
    selected.value = { runIndex, cardIndex }
    clearSaveState()
  }
}

const selectedProposal = computed(() => {
  const s = selected.value
  if (!s) return null
  return runs.value[s.runIndex]?.proposals[s.cardIndex] ?? null
})

async function onSaveSelected() {
  const s = selected.value
  const proposal = selectedProposal.value
  if (!s || !proposal || !currentIcon.value) return
  saving.value = true
  error.value = null
  clearSaveState()
  try {
    const res = await select(currentIcon.value, proposal)
    if (res.kind === 'written') {
      savedFilePath.value = res.filePath
    } else {
      conflict.value = {
        existingFile: res.existingFile,
        existingVariants: res.existingVariants,
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function onExportSelected() {
  const s = selected.value
  const proposal = selectedProposal.value
  if (!s || !proposal || !currentIcon.value) return
  const run = runs.value[s.runIndex]
  const verdict = run.verdicts[s.cardIndex]
  exporting.value = true
  error.value = null
  try {
    const res = await exportProposal({
      iconName: currentIcon.value,
      proposal,
      verdict,
      usage: run.usage,
      cost: run.cost,
      tier: run.tier,
    })
    exportedFilePath.value = res.filePath
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    exporting.value = false
  }
}

async function onRefine(runIndex: number, cardIndex: number, instruction: string) {
  if (!currentIcon.value) return
  refining.value = { runIndex, cardIndex }
  error.value = null
  const targetRun = runs.value[runIndex]
  const targetProposal = targetRun.proposals[cardIndex]
  // Refine with the same tier the card came from — keeps the "voice"
  // consistent with whichever model produced the original.
  const tier = targetRun.tier
  try {
    const res = await refine(currentIcon.value, targetProposal, instruction, tier, {
      allowSpawning: allowSpawning.value,
      allowMorphing: allowMorphing.value,
    })
    // Replace just that card's proposal + verdict.
    const updatedRun: RunResult = {
      ...targetRun,
      proposals: [...targetRun.proposals],
      verdicts: [...targetRun.verdicts],
    }
    updatedRun.proposals[cardIndex] = res.proposal
    updatedRun.verdicts[cardIndex] = res.verdict
    // Add the refine cost into the run's cost so it shows in the run header,
    // and into the session total.
    updatedRun.cost = {
      input_usd: targetRun.cost.input_usd + res.cost.input_usd,
      cache_write_usd: targetRun.cost.cache_write_usd + res.cost.cache_write_usd,
      cache_read_usd: targetRun.cost.cache_read_usd + res.cost.cache_read_usd,
      output_usd: targetRun.cost.output_usd + res.cost.output_usd,
      total_usd: targetRun.cost.total_usd + res.cost.total_usd,
    }
    sessionCostUsd.value += res.cost.total_usd
    const newRuns = [...runs.value]
    newRuns[runIndex] = updatedRun
    runs.value = newRuns
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    refining.value = null
  }
}

function isRefining(runIndex: number, cardIndex: number): boolean {
  return (
    refining.value?.runIndex === runIndex &&
    refining.value?.cardIndex === cardIndex
  )
}
function isSelected(runIndex: number, cardIndex: number): boolean {
  return (
    selected.value?.runIndex === runIndex &&
    selected.value?.cardIndex === cardIndex
  )
}

// ─── Batch mode ────────────────────────────────────────────────────────

const mode = ref<'single' | 'batch'>('single')
const activeBatchId = ref<string | null>(null)
const batchN = ref(20)
const batchTier = ref<ModelTier>('sonnet')
const batchEstimate = ref<BatchEstimate | null>(null)
const resumableList = ref<BatchListEntry[]>([])
const startingBatch = ref(false)

async function loadEstimate() {
  try {
    batchEstimate.value = await estimateBatch(
      batchN.value,
      batchTier.value,
      5,
    )
  } catch (e) {
    console.error('estimate failed:', e)
  }
}

async function refreshResumable() {
  try {
    // Show every batch — `listBatches()` is already sorted newest-first.
    // Filtering "done" batches out hides ones the user explicitly wants to
    // revisit (e.g. flip a different selection on a row they already saved).
    resumableList.value = await listBatches()
  } catch (e) {
    console.error('list failed:', e)
  }
}

watch([batchN, batchTier, mode], async () => {
  if (mode.value === 'batch' && !activeBatchId.value) {
    await loadEstimate()
  }
})

onMounted(() => {
  void refreshResumable()
})

async function onStartBatch() {
  if (startingBatch.value) return
  startingBatch.value = true
  error.value = null
  try {
    const { batchId } = await startBatch({
      n: batchN.value,
      tier: batchTier.value,
      options: {
        allowSpawning: allowSpawning.value,
        allowMorphing: allowMorphing.value,
      },
      concurrency: 5,
    })
    activeBatchId.value = batchId
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    startingBatch.value = false
  }
}

function onResumeBatch(id: string) {
  activeBatchId.value = id
}

function onCloseBatch() {
  activeBatchId.value = null
  void refreshResumable()
}

function fmtSeconds(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`
}
</script>

<template>
  <div v-if="mode === 'batch' && activeBatchId">
    <BatchView
      :batch-id="activeBatchId"
      :loop-mode="loopMode"
      @close="onCloseBatch"
    />
  </div>
  <div v-else class="app">
    <header>
      <div class="header-row">
        <h1>Forge</h1>
        <div class="header-controls">
          <div class="mode-toggle">
            <button :class="{ active: mode === 'single' }" @click="mode = 'single'">Single</button>
            <button :class="{ active: mode === 'batch' }" @click="mode = 'batch'">Batch</button>
          </div>
          <div class="session-cost" :title="`Total spend on Anthropic API since this page loaded`">
            session: <strong>{{ fmtCost(sessionCostUsd) }}</strong>
          </div>
        </div>
      </div>
      <p v-if="mode === 'single'" class="sub">Generate 3 animation proposals per Lucide icon. Click a card to select or open refine input.</p>
      <p v-else class="sub">Pick the most animation-worthy Lucide icons we don't yet ship, generate proposals for each, curate row by row.</p>
    </header>

    <!-- ─── Batch start panel ──────────────────────────────────────── -->
    <section v-if="mode === 'batch'" class="batch-start">
      <div v-if="resumableList.length" class="resumable">
        <p class="resumable-head">Recent batches:</p>
        <ul>
          <li v-for="b in resumableList" :key="b.id">
            <button class="resumable-link" @click="onResumeBatch(b.id)">
              <span class="resumable-id">{{ b.id.replace(/^batch-/, '') }}</span>
              <span class="resumable-meta">
                {{ b.status }} · {{ b.readyCount }}/{{ b.n }} ready · {{ b.selectedCount }} selected
              </span>
            </button>
          </li>
        </ul>
      </div>

      <div class="batch-config">
        <label class="config-row">
          <span>How many icons?</span>
          <input
            type="number"
            v-model.number="batchN"
            min="1"
            max="200"
            :disabled="startingBatch"
          />
        </label>
        <label class="config-row">
          <span>Tier</span>
          <select v-model="batchTier" :disabled="startingBatch">
            <option value="sonnet">Sonnet 4.6</option>
            <option value="opus">Opus 4.7</option>
          </select>
        </label>
        <div class="caps inline">
          <label>
            <input type="checkbox" v-model="allowSpawning" :disabled="startingBatch" />
            <span>+ spawn aux elements</span>
          </label>
          <label>
            <input type="checkbox" v-model="allowMorphing" :disabled="startingBatch" />
            <span>+ morph paths (flubber)</span>
          </label>
        </div>

        <p v-if="batchEstimate" class="estimate">
          <template v-if="batchEstimate.sample_size === 0">
            No prior runs to estimate from yet. First run will calibrate the cost log.
          </template>
          <template v-else>
            ≈ <strong>{{ fmtCost(batchEstimate.estimated_total_usd) }}</strong>
            (p90 {{ fmtCost(batchEstimate.estimated_p90_total_usd) }}) ·
            ~{{ fmtSeconds(batchEstimate.estimated_total_wall_ms) }} ·
            from {{ batchEstimate.sample_size }} prior {{ batchTier }} runs
          </template>
        </p>

        <button
          class="primary"
          :disabled="startingBatch || batchN < 1"
          @click="onStartBatch"
        >
          {{ startingBatch ? 'Starting…' : `Start batch (${batchN})` }}
        </button>
      </div>
    </section>

    <form v-if="mode === 'single'" class="bar" @submit.prevent="onGenerate">
      <input
        v-model="iconName"
        placeholder="lucide icon name (kebab-case)"
        :disabled="loading"
        autofocus
      />
      <button type="submit" :disabled="loading || !iconName.trim()">
        {{ loading ? 'Generating…' : 'Generate' }}
      </button>
    </form>

    <div v-if="mode === 'single'" class="caps">
      <label :title="`Let Claude add up to 3 auxiliary elements (sparks, ripples, motion trails) outside the source Lucide geometry. Useful for flame, bell, droplet, sparkle-style icons.`">
        <input type="checkbox" v-model="allowSpawning" :disabled="loading" />
        <span>+ spawn aux elements (sparks, ripples)</span>
      </label>
      <label :title="`Let Claude morph path silhouettes via flubber. Higher creative ceiling but adds runtime cost + flubber dep to icons that use it. Two endpoints should be visually similar (same family of shapes) for clean midpoints.`">
        <input type="checkbox" v-model="allowMorphing" :disabled="loading" />
        <span>+ morph paths (flubber)</span>
      </label>
    </div>

    <p v-if="error" class="err">Error: {{ error }}</p>

    <div v-if="loading && mode === 'single'" class="loader">
      <div class="spinner" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="loader-text">
        <div class="loader-status">{{ status }}</div>
        <div class="loader-meta">{{ loaderMeta }}</div>
      </div>
    </div>

    <section v-if="runs.length > 0 && mode === 'single'" class="result">
      <div class="result-header">
        <h2>{{ currentIcon }}</h2>
        <span class="result-cost">
          icon spend: <strong>{{ fmtCost(totalCostForCurrentIcon) }}</strong>
        </span>
        <div class="loop-toggle">
          <button
            :class="{ active: loopMode === 'loop' }"
            @click="loopMode = 'loop'"
          >▶ Loop</button>
          <button
            :class="{ active: loopMode === 'hover' }"
            @click="loopMode = 'hover'"
          >Hover</button>
        </div>
      </div>

      <div
        v-for="(run, runIdx) in runs"
        :key="runIdx"
        class="run-section"
      >
        <div class="run-header">
          <span
            class="model-badge"
            :class="run.tier"
          >
            {{ run.tier === 'opus' ? 'Opus 4.7' : 'Sonnet 4.6' }}
            <span v-if="run.autoEscalated" class="escalated-mark">↑ auto-escalated</span>
          </span>
          <span class="run-cost" :title="`in ${run.usage.input_tokens} (cache r:${run.usage.cache_read_input_tokens}/w:${run.usage.cache_creation_input_tokens}) + out ${run.usage.output_tokens}`">
            {{ fmtCost(run.cost.total_usd) }}
          </span>
        </div>
        <div class="grid">
          <ProposalCard
            v-for="(p, i) in run.proposals"
            :key="i"
            :proposal="p"
            :verdict="run.verdicts[i]"
            :index="i"
            :selected="isSelected(runIdx, i)"
            :refining="isRefining(runIdx, i)"
            :loop-mode="loopMode"
            @select="onSelect(runIdx, $event)"
            @refine="(idx, instr) => onRefine(runIdx, idx, instr)"
          />
        </div>
      </div>

      <div class="result-actions">
        <button
          v-if="selectedProposal && !conflict"
          class="save-btn"
          :disabled="saving"
          @click="onSaveSelected"
        >
          {{ saving ? 'Writing…' : `↳ Save to src/icons/${currentIcon}.vue` }}
        </button>
        <button
          v-if="!hasOpusRun && !loading"
          class="opus-btn"
          @click="onRegenerateWithOpus"
        >
          ↺ Regenerate with Opus 4.7 (Sonnet results stay visible)
        </button>
      </div>

      <p v-if="savedFilePath" class="saved-note">
        ✓ Wrote <code>{{ savedFilePath }}</code> + updated <code>icons-meta.ts</code> & <code>index.ts</code>.
      </p>

      <div v-if="conflict" class="conflict-note">
        <p class="conflict-headline">
          ⚠ <code>{{ currentIcon }}</code> already exists in the library
          <span v-if="conflict.existingVariants.length">
            (variants: {{ conflict.existingVariants.join(', ') }})
          </span>.
        </p>
        <p class="conflict-body">
          Refusing to overwrite — variant-merging across different element keys isn't built yet.
          Export the proposal JSON to <code>forge/saved_runs/</code> so it's not lost; we'll wire it back in once we have a real merge flow.
        </p>
        <div class="conflict-actions">
          <button
            class="export-btn"
            :disabled="exporting || !!exportedFilePath"
            @click="onExportSelected"
          >
            {{ exporting ? 'Exporting…' : exportedFilePath ? '✓ Exported' : '↓ Export to forge/saved_runs/' }}
          </button>
          <span v-if="exportedFilePath" class="exported-path"><code>{{ exportedFilePath }}</code></span>
        </div>
      </div>

      <details class="raw">
        <summary>Source SVG</summary>
        <pre>{{ sourceSvg }}</pre>
      </details>
    </section>
  </div>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #111; }
.app { max-width: 1200px; margin: 0 auto; padding: 32px; }

.header-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
header h1 { margin: 0; font-size: 28px; }
header .sub { margin: 4px 0 0; color: #666; }
.session-cost {
  font-size: 13px;
  color: #555;
  font-variant-numeric: tabular-nums;
}
.session-cost strong { color: #111; }

.header-controls { display: flex; align-items: center; gap: 16px; }
.mode-toggle {
  display: inline-flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
}
.mode-toggle button {
  background: white;
  border: none;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}
.mode-toggle button:hover { background: #f5f5f5; }
.mode-toggle button.active { background: #111; color: white; }

.batch-start {
  margin: 24px 0;
  padding: 24px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}
.batch-config { display: flex; flex-direction: column; gap: 14px; max-width: 480px; }
.config-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  font-size: 13px;
  color: #555;
}
.config-row input[type="number"], .config-row select {
  padding: 6px 10px;
  font-family: inherit;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 120px;
}
.caps.inline {
  margin: 0;
  padding-left: 160px;
}
.estimate {
  margin: 6px 0 0 0;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
  font-variant-numeric: tabular-nums;
}
.batch-config .primary {
  margin-top: 8px;
  align-self: flex-start;
  padding: 10px 24px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
}
.batch-config .primary:hover:not(:disabled) { background: #1d4ed8; }
.batch-config .primary:disabled { opacity: 0.5; cursor: not-allowed; }

.resumable {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eee;
}
.resumable-head {
  margin: 0 0 8px;
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.resumable ul { list-style: none; padding: 0; margin: 0; }
.resumable li { margin-bottom: 4px; }
.resumable-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
  font-family: inherit;
  cursor: pointer;
}
.resumable-link:hover { background: #f9fafb; border-color: #ccc; }
.resumable-id { font-family: ui-monospace, monospace; font-size: 12px; color: #111; }
.resumable-meta { font-size: 12px; color: #666; }

.bar {
  display: flex; gap: 12px;
  margin: 24px 0;
}
.bar input {
  flex: 1;
  padding: 10px 14px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: ui-monospace, monospace;
}
.bar button {
  padding: 10px 20px;
  font-size: 15px;
  border-radius: 8px;
  border: none;
  background: #111; color: white;
  cursor: pointer;
}
.bar button:disabled { opacity: 0.5; cursor: not-allowed; }
.caps {
  display: flex;
  gap: 18px;
  margin: -12px 0 16px;
  font-size: 13px;
  color: #555;
  flex-wrap: wrap;
}
.caps label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.caps input[type="checkbox"] { margin: 0; cursor: pointer; }
.caps input[type="checkbox"]:disabled { cursor: not-allowed; }
.err { color: #991b1b; padding: 12px; background: #fee2e2; border-radius: 8px; }

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.result-header h2 {
  font-family: ui-monospace, monospace;
  font-size: 20px;
  margin: 0;
}
.result-cost {
  font-size: 13px;
  color: #555;
  font-variant-numeric: tabular-nums;
}
.result-cost strong { color: #111; }
.loop-toggle {
  margin-left: auto;
  display: inline-flex;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  overflow: hidden;
}
.loop-toggle button {
  padding: 5px 12px;
  font-size: 12px;
  border: none;
  background: white;
  cursor: pointer;
}
.loop-toggle button.active { background: #111; color: white; }

.run-section { margin-bottom: 28px; }
.run-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.model-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #1e3a8a;
}
.model-badge.opus {
  background: #fef3c7;
  color: #78350f;
}
.escalated-mark {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.85;
}
.run-cost {
  font-size: 12px;
  color: #666;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.save-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #166534;
  background: #dcfce7;
  color: #14532d;
  cursor: pointer;
  font-family: ui-monospace, monospace;
}
.save-btn:hover { background: #bbf7d0; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.saved-note {
  margin-top: 12px;
  padding: 10px 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  font-size: 13px;
  color: #065f46;
}
.saved-note code { font-size: 12px; }

.conflict-note {
  margin-top: 12px;
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  color: #78350f;
  font-size: 13px;
}
.conflict-headline { margin: 0 0 6px; font-weight: 600; }
.conflict-body { margin: 0 0 10px; color: #92400e; line-height: 1.5; }
.conflict-actions {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.export-btn {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #b45309;
  background: white;
  color: #78350f;
  cursor: pointer;
  font-family: ui-monospace, monospace;
}
.export-btn:hover:not(:disabled) { background: #fef3c7; }
.export-btn:disabled { opacity: 0.6; cursor: default; }
.exported-path code { font-size: 12px; color: #92400e; }
.opus-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #d97706;
  background: #fef3c7;
  color: #78350f;
  cursor: pointer;
}
.opus-btn:hover { background: #fde68a; }

.raw {
  margin-top: 24px;
  font-size: 12px;
  color: #555;
}
.raw pre { background: white; padding: 12px; border-radius: 6px; overflow: auto; }

.loader {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}
.loader-status {
  font-weight: 600;
  font-size: 15px;
  color: #111;
}
.loader-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #777;
  font-variant-numeric: tabular-nums;
}
.spinner {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px;
  height: 20px;
}
.spinner span {
  width: 4px;
  background: #111;
  border-radius: 2px;
  animation: bounce 1.1s ease-in-out infinite;
}
.spinner span:nth-child(1) { animation-delay: 0s; }
.spinner span:nth-child(2) { animation-delay: 0.15s; }
.spinner span:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce {
  0%, 100% { height: 6px; }
  50%      { height: 20px; }
}
</style>
