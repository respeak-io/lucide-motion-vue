/**
 * Batch orchestrator.
 *
 * Lifecycle:
 *   start → ranking → generating → done   (or cancelled / error at any point)
 *
 * Generation runs in chunks of `concurrency` (default 5). A new chunk only
 * launches once the previous chunk fully resolves — keeps API pressure
 * bounded. Cancellation is honored between chunks: an in-flight chunk
 * finishes, then no further work is scheduled.
 *
 * State is mirrored to `forge/saved_runs/batch-<id>.json` on every mutation
 * so a forge restart doesn't lose the work. Subscribers (the SSE handler) get
 * notified synchronously after each mutation.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  BatchListEntry,
  BatchRow,
  BatchSaveResult,
  BatchState,
  BatchStatus,
  GenerationOptions,
  ModelTier,
  Proposal,
} from './schema'
import { generateProposals, refineProposal } from './anthropic'
import { detectCheap } from './cheap-detector'
import { computeCost } from './pricing'
import { fetchAllLucideNames, fetchLucideSvg, diffMissing } from './lucide'
import { selectRelevantIcons } from './relevance'
import { extractElements } from './svg-geometry'
import {
  findExistingIcon,
  writeIconSfc,
  writeMultiVariantSfc,
  areProposalsMergeCompatible,
  type WriteResult,
} from './sfc-writer'

const HERE = dirname(fileURLToPath(import.meta.url))
const SAVED_RUNS_DIR = join(HERE, '../saved_runs')

type Subscriber = (state: BatchState) => void

interface BatchEntry {
  state: BatchState
  cancelRequested: boolean
  subscribers: Set<Subscriber>
}

const batches = new Map<string, BatchEntry>()

function makeBatchId(): string {
  // ISO with `:` and `.` swapped for filesystem safety.
  return 'batch-' + new Date().toISOString().replace(/[:.]/g, '-')
}

function notify(entry: BatchEntry): void {
  entry.state.version += 1
  for (const sub of entry.subscribers) {
    try {
      sub(entry.state)
    } catch (err) {
      console.error('[forge-batch] subscriber threw:', err)
    }
  }
  void persist(entry.state).catch(err =>
    console.error('[forge-batch] persist failed:', err),
  )
}

async function persist(state: BatchState): Promise<void> {
  await mkdir(SAVED_RUNS_DIR, { recursive: true })
  const path = join(SAVED_RUNS_DIR, `${state.id}.json`)
  await writeFile(path, JSON.stringify(state, null, 2), 'utf8')
}

export interface StartBatchOptions {
  n: number
  tier: ModelTier
  options: GenerationOptions
  concurrency: number
}

export function startBatch(opts: StartBatchOptions): { batchId: string } {
  const id = makeBatchId()
  const state: BatchState = {
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
    n: opts.n,
    tier: opts.tier,
    options: opts.options,
    concurrency: Math.max(1, Math.min(10, opts.concurrency)),
    rows: [],
    totalLucide: 0,
    missingCount: 0,
    rankingCostUsd: 0,
    generationCostUsd: 0,
    version: 0,
  }
  const entry: BatchEntry = {
    state,
    cancelRequested: false,
    subscribers: new Set(),
  }
  batches.set(id, entry)
  // Run async — don't await. The SSE / polling endpoint surfaces progress.
  void runBatch(entry).catch(err => {
    console.error('[forge-batch] orchestrator failed:', err)
    entry.state.status = 'error'
    entry.state.error = err instanceof Error ? err.message : String(err)
    notify(entry)
  })
  notify(entry)
  return { batchId: id }
}

export function getBatch(id: string): BatchEntry | undefined {
  return batches.get(id)
}

/**
 * Resolve a batch by id, rehydrating from disk if it's not currently in
 * memory. The rehydrated entry has no orchestrator running — its persisted
 * status (typically `done` / `cancelled` / `error`) carries through. Used by
 * the dispatcher routes so the user can interact with persisted batches
 * (select / save / view) after a forge restart.
 */
export async function getOrLoadBatch(id: string): Promise<BatchEntry | null> {
  const existing = batches.get(id)
  if (existing) return existing
  const path = join(SAVED_RUNS_DIR, `${id}.json`)
  if (!existsSync(path)) return null
  try {
    const raw = await readFile(path, 'utf8')
    const state = JSON.parse(raw) as BatchState
    migrateBatchState(state)
    const entry: BatchEntry = {
      state,
      cancelRequested: false,
      subscribers: new Set(),
    }
    batches.set(id, entry)
    return entry
  } catch (err) {
    console.error('[forge-batch] failed to load batch from disk:', err)
    return null
  }
}

/**
 * Bring a persisted state up to the current schema. Forward-only — old
 * fields are dropped, new fields default to safe values. Run on every disk
 * read; no-op for batches written by the current code.
 */
function migrateBatchState(state: BatchState): void {
  for (const row of state.rows) {
    // selectedIndex (legacy single-pick) → selectedIndices array.
    const legacy = (row as unknown as { selectedIndex?: number | null }).selectedIndex
    if (row.selectedIndices == null) {
      row.selectedIndices = legacy != null ? [legacy] : []
    }
    delete (row as { selectedIndex?: unknown }).selectedIndex
    // Stale refiningCard from a forge crash mid-refine — clear so the UI
    // doesn't show a phantom spinner forever.
    if (row.refiningCard != null) row.refiningCard = null
  }
}

export function subscribe(id: string, fn: Subscriber): () => void {
  const entry = batches.get(id)
  if (!entry) throw new Error(`Unknown batch id: ${id}`)
  entry.subscribers.add(fn)
  return () => entry.subscribers.delete(fn)
}

export function cancelBatch(id: string): void {
  const entry = batches.get(id)
  if (!entry) throw new Error(`Unknown batch id: ${id}`)
  if (entry.state.status === 'done' || entry.state.status === 'error') return
  entry.cancelRequested = true
  // The orchestrator picks this up between chunks. Mark immediately so the
  // UI flips state.
  if (entry.state.status === 'pending' || entry.state.status === 'ranking') {
    entry.state.status = 'cancelled'
    notify(entry)
  }
}

export function setSelection(
  id: string,
  rowIndex: number,
  selectedIndices: number[],
): void {
  const entry = batches.get(id)
  if (!entry) throw new Error(`Unknown batch id: ${id}`)
  const row = entry.state.rows[rowIndex]
  if (!row) throw new Error(`Row ${rowIndex} not found in batch ${id}`)
  if (!Array.isArray(selectedIndices)) {
    throw new Error('selectedIndices must be an array of card indices.')
  }
  for (const i of selectedIndices) {
    if (typeof i !== 'number' || i < 0 || i > 2) {
      throw new Error(`Each selected index must be 0|1|2; got ${i}`)
    }
  }
  // Dedupe while preserving pick order.
  const seen = new Set<number>()
  row.selectedIndices = selectedIndices.filter(i => !seen.has(i) && (seen.add(i), true))
  notify(entry)
}

/**
 * Refine one of the three proposals on a batch row. Mirrors the single-icon
 * refine flow (`handleRefine`) but writes the new proposal back into the
 * batch state and persists, so subsequent saves use the refined version.
 * Increments the row's cost and the batch's `generationCostUsd` total.
 */
export async function refineRow(
  id: string,
  rowIndex: number,
  cardIndex: number,
  instruction: string,
): Promise<void> {
  const entry = batches.get(id)
  if (!entry) throw new Error(`Unknown batch id: ${id}`)
  const row = entry.state.rows[rowIndex]
  if (!row) throw new Error(`Row ${rowIndex} not found.`)
  if (row.status !== 'ready' || !row.proposals || !row.verdicts || !row.sourceSvg) {
    throw new Error(`Row ${rowIndex} is not ready for refine (status=${row.status}).`)
  }
  if (cardIndex < 0 || cardIndex > 2) {
    throw new Error(`cardIndex must be 0|1|2, got ${cardIndex}`)
  }
  const base = row.proposals[cardIndex]
  if (!base) throw new Error(`No proposal at cardIndex=${cardIndex}.`)

  row.refiningCard = cardIndex
  notify(entry)
  try {
    const startedAt = Date.now()
    const result = await refineProposal(
      row.iconName,
      row.sourceSvg,
      base,
      instruction,
      entry.state.tier,
      entry.state.options,
    )
    const wall_ms = Date.now() - startedAt
    const singlePath = extractElements(row.sourceSvg).length <= 1
    const cost = computeCost(entry.state.tier, result.usage)
    row.proposals[cardIndex] = result.proposal
    row.verdicts[cardIndex] = detectCheap(result.proposal, { singlePath })
    // Add the refine cost to the row + batch totals so the UI surface stays accurate.
    if (row.cost) {
      row.cost = {
        input_usd: row.cost.input_usd + cost.input_usd,
        cache_write_usd: row.cost.cache_write_usd + cost.cache_write_usd,
        cache_read_usd: row.cost.cache_read_usd + cost.cache_read_usd,
        output_usd: row.cost.output_usd + cost.output_usd,
        total_usd: row.cost.total_usd + cost.total_usd,
      }
    }
    entry.state.generationCostUsd += cost.total_usd
    void (await import('./cost-log')).logCost({
      ts: new Date().toISOString(),
      tier: entry.state.tier,
      kind: 'refine',
      input_tokens: result.usage.input_tokens,
      cache_creation_input_tokens: result.usage.cache_creation_input_tokens,
      cache_read_input_tokens: result.usage.cache_read_input_tokens,
      output_tokens: result.usage.output_tokens,
      total_usd: cost.total_usd,
      wall_ms,
      icon: row.iconName,
    })
  } finally {
    row.refiningCard = null
    notify(entry)
  }
}

export async function saveBatchSelections(
  id: string,
  rowIndices?: number[],
): Promise<BatchSaveResult[]> {
  const entry = batches.get(id)
  if (!entry) throw new Error(`Unknown batch id: ${id}`)
  const targets =
    rowIndices ??
    entry.state.rows
      .map((r, i) => ((r.selectedIndices?.length ?? 0) > 0 ? i : -1))
      .filter(i => i >= 0)
  const results: BatchSaveResult[] = []
  for (const idx of targets) {
    const row = entry.state.rows[idx]
    if (!row) {
      results.push({
        rowIndex: idx,
        iconName: '',
        outcome: { kind: 'failed', error: `Row ${idx} not found.` },
      })
      continue
    }
    if (row.status !== 'ready') {
      results.push({
        rowIndex: idx,
        iconName: row.iconName,
        outcome: { kind: 'skipped', reason: `Row not ready (${row.status}).` },
      })
      continue
    }
    const indices = row.selectedIndices ?? []
    if (indices.length === 0) {
      results.push({
        rowIndex: idx,
        iconName: row.iconName,
        outcome: { kind: 'skipped', reason: 'No proposal selected.' },
      })
      continue
    }
    const proposals = row.proposals
    if (!proposals) {
      results.push({
        rowIndex: idx,
        iconName: row.iconName,
        outcome: { kind: 'failed', error: 'Row has no proposals to save.' },
      })
      continue
    }
    const picks = indices.map(i => proposals[i]).filter(Boolean)
    if (picks.length !== indices.length) {
      results.push({
        rowIndex: idx,
        iconName: row.iconName,
        outcome: { kind: 'failed', error: 'Some selected proposals are missing.' },
      })
      continue
    }
    try {
      results.push(await writeRowSelections(row.iconName, picks, idx))
    } catch (err) {
      results.push({
        rowIndex: idx,
        iconName: row.iconName,
        outcome: {
          kind: 'failed',
          error: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }
  return results
}

/**
 * Write one row's selected proposals to disk.
 *
 * Single selection → original single-variant SFC.
 *
 * Multi-selection where shapes are compatible → one multi-variant SFC with
 * `animations: { default, alt, alt-2, … }`.
 *
 * Multi-selection with diverging shapes → first goes to `<base>.vue`, the
 * rest land in numbered siblings `<base>-2.vue`, `<base>-3.vue`. Conflict
 * checks run per-target; if any name is already taken, that target is
 * reported as a conflict and the rest still write.
 */
async function writeRowSelections(
  iconName: string,
  picks: BatchRowProposal[],
  rowIndex: number,
): Promise<BatchSaveResult> {
  // Single selection: existing path.
  if (picks.length === 1) {
    const existing = await findExistingIcon(iconName)
    if (existing) {
      return {
        rowIndex,
        iconName,
        outcome: {
          kind: 'conflict',
          existingFile: existing.filePath,
          existingVariants: existing.variants,
        },
      }
    }
    const out = await writeIconSfc(iconName, picks[0])
    return {
      rowIndex,
      iconName,
      outcome: {
        kind: 'written',
        files: [{ filePath: out.filePath, variants: ['default'] }],
        merged: false,
      },
    }
  }

  // Multi: try merge first.
  if (areProposalsMergeCompatible(picks)) {
    const existing = await findExistingIcon(iconName)
    if (existing) {
      return {
        rowIndex,
        iconName,
        outcome: {
          kind: 'conflict',
          existingFile: existing.filePath,
          existingVariants: existing.variants,
        },
      }
    }
    const variantNames = generateVariantNames(picks.length)
    const named = picks.map((proposal, i) => ({
      name: variantNames[i],
      proposal,
    }))
    const out = await writeMultiVariantSfc(iconName, named)
    return {
      rowIndex,
      iconName,
      outcome: {
        kind: 'written',
        files: [{ filePath: out.filePath, variants: variantNames }],
        merged: true,
      },
    }
  }

  // Incompatible: numbered standalone files.
  const targets = picks.map((proposal, i) => ({
    proposal,
    name: i === 0 ? iconName : `${iconName}-${i + 1}`,
  }))
  // Conflict scan up front so we can short-circuit cleanly.
  for (const t of targets) {
    const existing = await findExistingIcon(t.name)
    if (existing) {
      return {
        rowIndex,
        iconName,
        outcome: {
          kind: 'conflict',
          existingFile: existing.filePath,
          existingVariants: existing.variants,
        },
      }
    }
  }
  const written: WriteResult[] = []
  for (const t of targets) written.push(await writeIconSfc(t.name, t.proposal))
  return {
    rowIndex,
    iconName,
    outcome: {
      kind: 'written',
      files: written.map(w => ({ filePath: w.filePath, variants: ['default'] })),
      merged: false,
    },
  }
}

/** 'default', 'alt', 'alt-2', 'alt-3', … */
function generateVariantNames(count: number): string[] {
  const out = ['default']
  for (let i = 1; i < count; i++) {
    out.push(i === 1 ? 'alt' : `alt-${i}`)
  }
  return out
}

type BatchRowProposal = NonNullable<BatchState['rows'][number]['proposals']>[number]

export async function listBatches(): Promise<BatchListEntry[]> {
  const out: BatchListEntry[] = []
  // In-memory entries first (live and freshly mutated).
  const seen = new Set<string>()
  for (const entry of batches.values()) {
    out.push(toListEntry(entry.state))
    seen.add(entry.state.id)
  }
  // Then disk entries we don't have in memory (persisted from prior runs).
  if (existsSync(SAVED_RUNS_DIR)) {
    const files = await readdir(SAVED_RUNS_DIR)
    for (const f of files) {
      if (!f.startsWith('batch-') || !f.endsWith('.json')) continue
      const id = f.replace(/\.json$/, '')
      if (seen.has(id)) continue
      try {
        const raw = await readFile(join(SAVED_RUNS_DIR, f), 'utf8')
        const state = JSON.parse(raw) as BatchState
        migrateBatchState(state)
        out.push(toListEntry(state))
      } catch {
        // Skip malformed.
      }
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return out
}

function toListEntry(state: BatchState): BatchListEntry {
  return {
    id: state.id,
    createdAt: state.createdAt,
    status: state.status,
    n: state.n,
    rowCount: state.rows.length,
    readyCount: state.rows.filter(r => r.status === 'ready').length,
    selectedCount: state.rows.filter(r => (r.selectedIndices?.length ?? 0) > 0).length,
  }
}

async function runBatch(entry: BatchEntry): Promise<void> {
  const { state } = entry

  // 1. Rank
  state.status = 'ranking'
  notify(entry)
  const [allNames, missing] = await Promise.all([
    fetchAllLucideNames(),
    diffMissing(),
  ])
  if (entry.cancelRequested) {
    finalize(entry, 'cancelled')
    return
  }
  state.totalLucide = allNames.length
  state.missingCount = missing.length
  if (missing.length === 0) {
    finalize(entry, 'done')
    return
  }
  const ranking = await selectRelevantIcons(missing, state.n, state.tier)
  state.rankingCostUsd = ranking.cost.total_usd
  state.rows = ranking.picks.map(p => ({
    iconName: p.name,
    reason: p.reason,
    status: 'pending' as const,
  }))
  notify(entry)
  if (entry.cancelRequested) {
    finalize(entry, 'cancelled')
    return
  }

  // 2. Generate, chunked
  state.status = 'generating'
  notify(entry)
  const indices = state.rows.map((_, i) => i)
  for (let cursor = 0; cursor < indices.length; cursor += state.concurrency) {
    if (entry.cancelRequested) {
      finalize(entry, 'cancelled')
      return
    }
    const chunk = indices.slice(cursor, cursor + state.concurrency)
    await Promise.all(chunk.map(i => processRow(entry, i)))
  }
  finalize(entry, entry.cancelRequested ? 'cancelled' : 'done')
}

async function processRow(entry: BatchEntry, rowIndex: number): Promise<void> {
  const row = entry.state.rows[rowIndex]
  try {
    row.status = 'fetching'
    notify(entry)
    const sourceSvg = await fetchLucideSvg(row.iconName)
    row.sourceSvg = sourceSvg
    row.status = 'generating'
    notify(entry)

    const startedAt = Date.now()
    const { proposals, usage } = await generateProposals(
      row.iconName,
      sourceSvg,
      entry.state.tier,
      entry.state.options,
    )
    const wall_ms = Date.now() - startedAt
    const singlePath = extractElements(sourceSvg).length <= 1
    const verdicts = proposals.map((p: Proposal) => detectCheap(p, { singlePath }))
    const cost = computeCost(entry.state.tier, usage)
    row.proposals = proposals
    row.verdicts = verdicts
    row.usage = usage
    row.cost = cost
    row.selectedIndices = []
    row.status = 'ready'
    entry.state.generationCostUsd += cost.total_usd
    // logCost is fired by generateProposals' caller path normally — but we
    // bypass api-plugin's buildRun here, so log directly.
    void (await import('./cost-log')).logCost({
      ts: new Date().toISOString(),
      tier: entry.state.tier,
      kind: 'generate',
      input_tokens: usage.input_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens,
      cache_read_input_tokens: usage.cache_read_input_tokens,
      output_tokens: usage.output_tokens,
      total_usd: cost.total_usd,
      wall_ms,
      icon: row.iconName,
    })
    notify(entry)
  } catch (err) {
    row.status = 'failed'
    row.error = err instanceof Error ? err.message : String(err)
    console.error(`[forge-batch] row ${rowIndex} (${row.iconName}) failed:`, err)
    notify(entry)
  }
}

function finalize(entry: BatchEntry, status: BatchStatus): void {
  entry.state.status = status
  notify(entry)
}
