import type {
  GenerateResponse,
  RefineResponse,
  SelectResponse,
  ExportResponse,
  ExportRequest,
  Proposal,
  ModelTier,
  GenerationOptions,
  BatchStartRequest,
  BatchStartResponse,
  BatchListEntry,
  BatchState,
  BatchSaveResult,
} from '../server/schema'

export type GenerateResult = GenerateResponse
export type RefineResult = RefineResponse
export type SelectResult = SelectResponse
export type ExportResult = ExportResponse

export async function generate(
  iconName: string,
  tier: ModelTier = 'sonnet',
  options: GenerationOptions = {},
): Promise<GenerateResult> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iconName, tier, options }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as GenerateResult
}

export async function refine(
  iconName: string,
  base: Proposal,
  instruction: string,
  tier: ModelTier = 'sonnet',
  options: GenerationOptions = {},
): Promise<RefineResult> {
  const res = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iconName, base, instruction, tier, options }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as RefineResult
}

export async function select(
  iconName: string,
  proposal: Proposal,
): Promise<SelectResult> {
  const res = await fetch('/api/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iconName, proposal }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as SelectResult
}

export async function exportProposal(req: ExportRequest): Promise<ExportResult> {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as ExportResult
}

// ─── Batch mode ──────────────────────────────────────────────────────────

export interface BatchEstimate {
  median_usd: number
  p90_usd: number
  median_wall_ms: number
  sample_size: number
  estimated_total_usd: number
  estimated_p90_total_usd: number
  estimated_total_wall_ms: number
}

export async function estimateBatch(
  n: number,
  tier: ModelTier,
  concurrency: number,
): Promise<BatchEstimate> {
  const params = new URLSearchParams({
    n: String(n),
    tier,
    concurrency: String(concurrency),
  })
  const res = await fetch(`/api/batch/estimate?${params}`)
  if (!res.ok) throw new Error(`estimate failed: ${res.status}`)
  return (await res.json()) as BatchEstimate
}

export async function startBatch(
  req: BatchStartRequest,
): Promise<BatchStartResponse> {
  const res = await fetch('/api/batch/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `start failed: ${res.status}`)
  }
  return (await res.json()) as BatchStartResponse
}

export async function listBatches(): Promise<BatchListEntry[]> {
  const res = await fetch('/api/batch/list')
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return (await res.json()) as BatchListEntry[]
}

export async function getBatch(id: string): Promise<BatchState> {
  const res = await fetch(`/api/batch/${encodeURIComponent(id)}`)
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `get failed: ${res.status}`)
  }
  return (await res.json()) as BatchState
}

/**
 * Open an SSE stream for live batch updates. `onState` is invoked on every
 * state event; `onError` is invoked on EventSource errors. Returns an
 * unsubscribe function that closes the connection.
 */
export function streamBatch(
  id: string,
  onState: (state: BatchState) => void,
  onError?: (event: Event) => void,
): () => void {
  const es = new EventSource(`/api/batch/${encodeURIComponent(id)}/stream`)
  es.onmessage = ev => {
    try {
      const parsed = JSON.parse(ev.data) as { type: string; state?: BatchState }
      if (parsed.type === 'state' && parsed.state) onState(parsed.state)
    } catch (err) {
      console.error('streamBatch parse error:', err, ev.data)
    }
  }
  if (onError) es.onerror = onError
  return () => es.close()
}

export async function selectBatchRow(
  id: string,
  rowIndex: number,
  selectedIndices: number[],
): Promise<void> {
  const res = await fetch(`/api/batch/${encodeURIComponent(id)}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowIndex, selectedIndices }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `select failed: ${res.status}`)
  }
}

/**
 * Toggle one card index inside an existing selection. If the card is already
 * selected, drop it; otherwise append it (preserving pick order).
 */
export function toggleSelection(
  current: number[] | undefined,
  cardIndex: number,
): number[] {
  const arr = current ?? []
  const at = arr.indexOf(cardIndex)
  if (at >= 0) {
    const out = [...arr]
    out.splice(at, 1)
    return out
  }
  return [...arr, cardIndex]
}

export async function saveBatch(
  id: string,
  rowIndices?: number[],
): Promise<BatchSaveResult[]> {
  const res = await fetch(`/api/batch/${encodeURIComponent(id)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowIndices }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `save failed: ${res.status}`)
  }
  return ((await res.json()) as { results: BatchSaveResult[] }).results
}

export async function cancelBatch(id: string): Promise<void> {
  const res = await fetch(`/api/batch/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`cancel failed: ${res.status}`)
}

export async function refineBatchRow(
  id: string,
  rowIndex: number,
  cardIndex: number,
  instruction: string,
): Promise<void> {
  const res = await fetch(`/api/batch/${encodeURIComponent(id)}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowIndex, cardIndex, instruction }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `refine failed: ${res.status}`)
  }
}
