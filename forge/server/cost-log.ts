import { appendFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CostLogEntry, ModelTier } from './schema'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOG_PATH = join(HERE, '../.cost-log.jsonl')

export async function logCost(entry: CostLogEntry): Promise<void> {
  await appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8')
}

export interface BatchCostEstimate {
  /** Median per-icon total cost across the sample. */
  median_usd: number
  /** 90th percentile per-icon cost — surface alongside median for the upper bound. */
  p90_usd: number
  /** Median per-icon wall time, milliseconds. */
  median_wall_ms: number
  /** Number of historical entries used. */
  sample_size: number
  /** Median × n. */
  estimated_total_usd: number
  /** p90 × n — upper-end estimate. */
  estimated_p90_total_usd: number
  /** Median wall × n / concurrency, milliseconds. */
  estimated_total_wall_ms: number
}

const SAMPLE_TAIL = 50

/**
 * Read the trailing entries for a given kind+tier and return a per-icon
 * estimate scaled to `n`. `wall_ms` is divided by `concurrency` because
 * batch mode runs `concurrency` calls in parallel.
 */
export async function estimateBatchCost(
  tier: ModelTier,
  n: number,
  concurrency: number,
  kind: CostLogEntry['kind'] = 'generate',
): Promise<BatchCostEstimate> {
  const entries = await readTail(SAMPLE_TAIL, e => e.tier === tier && e.kind === kind)
  if (entries.length === 0) {
    return {
      median_usd: 0,
      p90_usd: 0,
      median_wall_ms: 0,
      sample_size: 0,
      estimated_total_usd: 0,
      estimated_p90_total_usd: 0,
      estimated_total_wall_ms: 0,
    }
  }
  const costs = entries.map(e => e.total_usd).sort((a, b) => a - b)
  const walls = entries.map(e => e.wall_ms).sort((a, b) => a - b)
  const median_usd = percentile(costs, 0.5)
  const p90_usd = percentile(costs, 0.9)
  const median_wall_ms = percentile(walls, 0.5)
  return {
    median_usd,
    p90_usd,
    median_wall_ms,
    sample_size: entries.length,
    estimated_total_usd: median_usd * n,
    estimated_p90_total_usd: p90_usd * n,
    estimated_total_wall_ms: (median_wall_ms * n) / Math.max(1, concurrency),
  }
}

function percentile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.min(sortedAsc.length - 1, Math.floor(q * sortedAsc.length))
  return sortedAsc[idx]
}

async function readTail(
  max: number,
  predicate: (e: CostLogEntry) => boolean,
): Promise<CostLogEntry[]> {
  if (!existsSync(LOG_PATH)) return []
  const raw = await readFile(LOG_PATH, 'utf8')
  const lines = raw.split('\n')
  const out: CostLogEntry[] = []
  for (let i = lines.length - 1; i >= 0 && out.length < max; i--) {
    const line = lines[i].trim()
    if (!line) continue
    try {
      const entry = JSON.parse(line) as CostLogEntry
      if (predicate(entry)) out.push(entry)
    } catch {
      // Skip malformed lines — file is append-only so partial writes are rare.
    }
  }
  return out
}
