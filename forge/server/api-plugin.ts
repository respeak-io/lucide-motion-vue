import type { Plugin, Connect } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ServerResponse } from 'node:http'
import { generateProposals, refineProposal } from './anthropic'
import { fetchLucideSvg, fetchAllLucideNames, diffMissing } from './lucide'
import { selectRelevantIcons } from './relevance'
import { detectCheap } from './cheap-detector'
import {
  startBatch,
  getBatch,
  getOrLoadBatch,
  cancelBatch,
  setSelection,
  saveBatchSelections,
  listBatches,
  subscribe,
  refineRow,
} from './batch'
import { estimateBatchCost } from './cost-log'
import { computeCost } from './pricing'
import { logCost } from './cost-log'
import { writeIconSfc, findExistingIcon } from './sfc-writer'
import { exportProposal } from './export'
import { extractElements } from './svg-geometry'
import type {
  GenerateRequest,
  GenerateResponse,
  RefineRequest,
  RefineResponse,
  RunResult,
  Proposal,
  ModelTier,
  SelectRequest,
  SelectResponse,
  ExportRequest,
  ExportResponse,
  GenerationOptions,
  BatchCandidatesRequest,
  BatchCandidatesResponse,
  BatchStartRequest,
  BatchStartResponse,
  BatchSelectRequest,
  BatchSaveRequest,
  BatchSaveResponse,
  BatchListEntry,
  BatchState,
} from './schema'

/**
 * Load forge/.env into process.env if present. Vite auto-loads .env for the
 * client (only `VITE_*`-prefixed vars), but server-side plugin code is plain
 * Node — we need to populate process.env ourselves before the Anthropic SDK
 * reads it.
 */
function loadDotenv(): void {
  const here = dirname(fileURLToPath(import.meta.url))
  const envPath = join(here, '../.env')
  if (!existsSync(envPath)) return
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}
loadDotenv()

/**
 * Vite plugin that mounts /api/* routes inside the dev server. Single-process
 * setup — no separate Node server needed. The plugin runs in serve mode only.
 */
export function forgeApiPlugin(): Plugin {
  return {
    name: 'forge-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/generate', wrap(handleGenerate))
      server.middlewares.use('/api/refine', wrap(handleRefine))
      server.middlewares.use('/api/select', wrap(handleSelect))
      server.middlewares.use('/api/export', wrap(handleExport))
      // Specific batch routes registered before the catch-all dispatcher
      // so prefix matching picks them off first.
      server.middlewares.use('/api/batch/candidates', wrap(handleBatchCandidates))
      server.middlewares.use('/api/batch', batchDispatcher)
      server.middlewares.use('/api/health', wrap(handleHealth))
    },
  }
}

type Handler = (
  req: Connect.IncomingMessage,
  body: unknown,
) => Promise<unknown>

function wrap(handler: Handler): Connect.NextHandleFunction {
  return async (req, res) => {
    try {
      const body = req.method === 'POST' ? await readJson(req) : undefined
      const result = await handler(req, body)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[forge-api]', err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: message }))
    }
  }
}

async function readJson(req: Connect.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function handleHealth(): Promise<{ ok: true }> {
  return { ok: true }
}

async function handleBatchCandidates(
  _req: Connect.IncomingMessage,
  body: unknown,
): Promise<BatchCandidatesResponse> {
  const { n, tier: requestedTier } = (body ?? {}) as Partial<BatchCandidatesRequest>
  if (typeof n !== 'number' || n < 1 || !Number.isFinite(n)) {
    throw new Error('Missing or invalid `n` (must be a positive number).')
  }
  const tier: ModelTier = requestedTier === 'opus' ? 'opus' : 'sonnet'
  const [allNames, missing] = await Promise.all([
    fetchAllLucideNames(),
    diffMissing(),
  ])
  if (missing.length === 0) {
    return {
      picks: [],
      total_lucide: allNames.length,
      missing_count: 0,
      cost_usd: 0,
      wall_ms: 0,
      tier,
    }
  }
  const result = await selectRelevantIcons(missing, n, tier)
  console.log(
    `[forge] batch/candidates n=${n} tier=${tier} missing=${missing.length} picks=${result.picks.length} cost=$${result.cost.total_usd.toFixed(4)} wall=${result.wall_ms}ms`,
  )
  return {
    picks: result.picks,
    total_lucide: allNames.length,
    missing_count: missing.length,
    cost_usd: result.cost.total_usd,
    wall_ms: result.wall_ms,
    tier: result.tier,
  }
}

/**
 * Auto-escalate when ≥ this many of the 3 Sonnet proposals fail the
 * cheap-detector. The icon is "hard" enough that Opus 4.7 is worth the
 * cost.
 */
const ESCALATE_THRESHOLD = 2

async function buildRun(
  iconName: string,
  sourceSvg: string,
  tier: ModelTier,
  autoEscalated: boolean,
  options: GenerationOptions,
): Promise<RunResult> {
  const startedAt = Date.now()
  const { proposals, usage } = await generateProposals(iconName, sourceSvg, tier, options)
  const wall_ms = Date.now() - startedAt
  // Single-element icons get a relaxed verdict (≥1 visible variant rather
  // than ≥2) — the schema enforces ≥2 elsewhere wouldn't let `flame` /
  // `brush` ever pass without faking duplicate paths.
  const singlePath = extractElements(sourceSvg).length <= 1
  const verdicts = proposals.map(p => detectCheap(p, { singlePath }))
  const cost = computeCost(tier, usage)
  void logCost({
    ts: new Date().toISOString(),
    tier,
    kind: 'generate',
    input_tokens: usage.input_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens,
    output_tokens: usage.output_tokens,
    total_usd: cost.total_usd,
    wall_ms,
    icon: iconName,
  }).catch(err => console.error('[forge-api] cost-log write failed:', err))
  return { tier, proposals, verdicts, usage, cost, autoEscalated }
}

async function handleGenerate(
  _req: Connect.IncomingMessage,
  body: unknown,
): Promise<GenerateResponse> {
  const { iconName, tier: requestedTier, options: rawOptions } =
    (body ?? {}) as Partial<GenerateRequest>
  if (!iconName || typeof iconName !== 'string') {
    throw new Error('Missing or invalid `iconName`')
  }
  const tier: ModelTier = requestedTier === 'opus' ? 'opus' : 'sonnet'
  const options: GenerationOptions = {
    allowSpawning: !!rawOptions?.allowSpawning,
    allowMorphing: !!rawOptions?.allowMorphing,
  }
  const sourceSvg = await fetchLucideSvg(iconName)

  const runs: RunResult[] = []
  const firstRun = await buildRun(iconName, sourceSvg, tier, false, options)
  runs.push(firstRun)

  // Auto-escalate sonnet → opus when too many proposals are flagged cheap.
  if (tier === 'sonnet') {
    const flaggedCount = firstRun.verdicts.filter(v => !v.passed).length
    if (flaggedCount >= ESCALATE_THRESHOLD) {
      console.log(
        `[forge] auto-escalating "${iconName}": ${flaggedCount}/3 proposals flagged cheap`,
      )
      runs.push(await buildRun(iconName, sourceSvg, 'opus', true, options))
    }
  }

  return { iconName, sourceSvg, runs }
}

async function handleSelect(
  _req: Connect.IncomingMessage,
  body: unknown,
): Promise<SelectResponse> {
  const { iconName, proposal } = (body ?? {}) as Partial<SelectRequest>
  if (!iconName || typeof iconName !== 'string') {
    throw new Error('Missing or invalid `iconName`')
  }
  if (!proposal || typeof proposal !== 'object') {
    throw new Error('Missing or invalid `proposal`')
  }

  // Conflict guard: never overwrite an icon that's already in the library.
  // Variant-merging across different element-key conventions isn't built
  // yet — the client surfaces a warning + offers JSON export instead.
  const existing = await findExistingIcon(iconName)
  if (existing) {
    console.log(
      `[forge] conflict: ${iconName} already exists at ${existing.filePath} (variants: ${existing.variants.join(', ')})`,
    )
    return {
      kind: 'conflict',
      iconName,
      existingFile: existing.filePath,
      existingVariants: existing.variants,
    }
  }

  const result = await writeIconSfc(iconName, proposal as Proposal)
  console.log(
    `[forge] wrote ${result.filePath} (meta:${result.metaUpdated} index:${result.indexUpdated})`,
  )
  return { kind: 'written', iconName, filePath: result.filePath }
}

async function handleExport(
  _req: Connect.IncomingMessage,
  body: unknown,
): Promise<ExportResponse> {
  const req = (body ?? {}) as Partial<ExportRequest>
  if (!req.iconName || typeof req.iconName !== 'string') {
    throw new Error('Missing or invalid `iconName`')
  }
  if (!req.proposal || typeof req.proposal !== 'object') {
    throw new Error('Missing or invalid `proposal`')
  }
  if (!req.verdict || !req.usage || !req.cost || !req.tier) {
    throw new Error('Missing required export metadata (verdict/usage/cost/tier)')
  }
  const result = await exportProposal(req as ExportRequest)
  console.log(`[forge] exported ${req.iconName} → ${result.filePath}`)
  return result
}

async function handleRefine(
  _req: Connect.IncomingMessage,
  body: unknown,
): Promise<RefineResponse> {
  const { iconName, base, instruction, tier: requestedTier, options: rawOptions } =
    (body ?? {}) as Partial<RefineRequest>
  if (!iconName || typeof iconName !== 'string') {
    throw new Error('Missing or invalid `iconName`')
  }
  if (!base || typeof base !== 'object') {
    throw new Error('Missing or invalid `base` proposal')
  }
  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    throw new Error('Missing or invalid `instruction`')
  }
  const tier: ModelTier = requestedTier === 'opus' ? 'opus' : 'sonnet'
  const options: GenerationOptions = {
    allowSpawning: !!rawOptions?.allowSpawning,
    allowMorphing: !!rawOptions?.allowMorphing,
  }
  const sourceSvg = await fetchLucideSvg(iconName)
  const startedAt = Date.now()
  const { proposal, usage } = await refineProposal(
    iconName,
    sourceSvg,
    base as Proposal,
    instruction,
    tier,
    options,
  )
  const wall_ms = Date.now() - startedAt
  const singlePath = extractElements(sourceSvg).length <= 1
  const verdict = detectCheap(proposal, { singlePath })
  const cost = computeCost(tier, usage)
  void logCost({
    ts: new Date().toISOString(),
    tier,
    kind: 'refine',
    input_tokens: usage.input_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens,
    output_tokens: usage.output_tokens,
    total_usd: cost.total_usd,
    wall_ms,
    icon: iconName,
  }).catch(err => console.error('[forge-api] cost-log write failed:', err))
  return { proposal, verdict, usage, cost, tier }
}

/**
 * Dispatcher for /api/batch/* (excluding /candidates which has its own
 * registration). Routes:
 *   POST /start             → start a new batch
 *   GET  /list              → list batches (in-memory + persisted)
 *   GET  /:id               → snapshot of one batch
 *   GET  /:id/stream        → SSE feed of batch updates
 *   POST /:id/select        → set selectedIndex on a row
 *   POST /:id/save          → flush selections to library
 *   POST /:id/cancel        → request cancellation
 *
 * `req.url` here is the path *after* the `/api/batch` prefix (Connect strips
 * it on `use(path, handler)`).
 */
const batchDispatcher: Connect.NextHandleFunction = async (req, res) => {
  try {
    const url = req.url ?? '/'
    const path = url.split('?')[0]
    const method = req.method ?? 'GET'

    // /start
    if (path === '/start' && method === 'POST') {
      const body = (await readJson(req)) as Partial<BatchStartRequest>
      if (typeof body?.n !== 'number' || body.n < 1) {
        return jsonError(res, 400, '`n` must be a positive number.')
      }
      const tier: ModelTier = body.tier === 'opus' ? 'opus' : 'sonnet'
      const options: GenerationOptions = {
        allowSpawning: !!body.options?.allowSpawning,
        allowMorphing: !!body.options?.allowMorphing,
      }
      const concurrency = body.concurrency ?? 5
      const { batchId } = startBatch({ n: body.n, tier, options, concurrency })
      return jsonOk(res, { batchId } satisfies BatchStartResponse)
    }

    // /list
    if (path === '/list' && method === 'GET') {
      const list = await listBatches()
      return jsonOk(res, list satisfies BatchListEntry[])
    }

    // /estimate?n=&tier=&concurrency=
    if (path === '/estimate' && method === 'GET') {
      const u = new URL(url, 'http://localhost')
      const n = Number(u.searchParams.get('n') ?? '0')
      const tierParam = u.searchParams.get('tier')
      const tier: ModelTier = tierParam === 'opus' ? 'opus' : 'sonnet'
      const concurrency = Number(u.searchParams.get('concurrency') ?? '5')
      if (!Number.isFinite(n) || n < 1) {
        return jsonError(res, 400, '`n` query param must be a positive number.')
      }
      const est = await estimateBatchCost(tier, n, concurrency)
      return jsonOk(res, est)
    }

    // Per-id routes: /:id, /:id/stream, /:id/select, /:id/save, /:id/cancel
    const m = path.match(/^\/([^/]+)(?:\/([^/]+))?$/)
    if (!m) return jsonError(res, 404, `Unknown batch route: ${method} ${path}`)
    const [, id, sub] = m

    if (!sub && method === 'GET') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      return jsonOk(res, entry.state satisfies BatchState)
    }

    if (sub === 'stream' && method === 'GET') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      return handleSse(id, res, req)
    }

    if (sub === 'select' && method === 'POST') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      const body = (await readJson(req)) as Partial<BatchSelectRequest>
      if (typeof body?.rowIndex !== 'number') {
        return jsonError(res, 400, '`rowIndex` must be a number.')
      }
      if (
        !Array.isArray(body.selectedIndices) ||
        body.selectedIndices.some(
          i => typeof i !== 'number' || i < 0 || i > 2,
        )
      ) {
        return jsonError(
          res,
          400,
          '`selectedIndices` must be an array of card indices (0|1|2).',
        )
      }
      setSelection(id, body.rowIndex, body.selectedIndices)
      return jsonOk(res, { ok: true })
    }

    if (sub === 'save' && method === 'POST') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      const body = (await readJson(req)) as Partial<BatchSaveRequest>
      const indices =
        Array.isArray(body?.rowIndices) &&
        body!.rowIndices!.every(i => typeof i === 'number')
          ? (body!.rowIndices as number[])
          : undefined
      const results = await saveBatchSelections(id, indices)
      return jsonOk(res, { results } satisfies BatchSaveResponse)
    }

    if (sub === 'cancel' && method === 'POST') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      cancelBatch(id)
      return jsonOk(res, { ok: true })
    }

    if (sub === 'refine' && method === 'POST') {
      const entry = await getOrLoadBatch(id)
      if (!entry) return jsonError(res, 404, `Batch not found: ${id}`)
      const body = (await readJson(req)) as Partial<{
        rowIndex: number
        cardIndex: number
        instruction: string
      }>
      if (
        typeof body?.rowIndex !== 'number' ||
        typeof body?.cardIndex !== 'number' ||
        typeof body?.instruction !== 'string' ||
        !body.instruction.trim()
      ) {
        return jsonError(
          res,
          400,
          'refine requires { rowIndex: number, cardIndex: number, instruction: string }',
        )
      }
      await refineRow(id, body.rowIndex, body.cardIndex, body.instruction)
      return jsonOk(res, { ok: true })
    }

    return jsonError(res, 404, `Unknown batch route: ${method} ${path}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[forge-batch-api]', err)
    return jsonError(res, 500, message)
  }
}

function jsonOk(res: ServerResponse, body: unknown): void {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function jsonError(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: message }))
}

/**
 * Server-Sent Events feed for one batch. Sends an initial snapshot, then
 * pushes a fresh `state` event on every mutation. 15s heartbeat keeps proxies
 * alive — though in our local Vite setup there's no proxy, the HTTP/1.1
 * keep-alive is enough on its own. Heartbeat is cheap and future-proofs.
 */
function handleSse(
  id: string,
  res: ServerResponse,
  req: Connect.IncomingMessage,
): void {
  const entry = getBatch(id)
  if (!entry) {
    return jsonError(res, 404, `Batch not in memory: ${id}`)
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  // Flush headers immediately. Without this some clients buffer the first
  // event under whatever default chunk size the platform chooses.
  res.flushHeaders?.()

  const send = (state: BatchState) => {
    res.write(`data: ${JSON.stringify({ type: 'state', state })}\n\n`)
  }
  send(entry.state)
  const unsubscribe = subscribe(id, send)

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`)
  }, 15000)

  const cleanup = () => {
    clearInterval(heartbeat)
    unsubscribe()
    res.end()
  }
  req.on('close', cleanup)
  req.on('error', cleanup)
}
