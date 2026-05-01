/**
 * Shared types between server and client.
 *
 * The model's job is to produce JSON conforming to `Proposal[]`. The forge UI
 * renders previews directly from this JSON via a generic preview component —
 * no SFC compilation in the browser. When the maintainer picks a proposal,
 * the server converts it to a Vue SFC and writes it to `src/icons/<name>.vue`.
 */

export type SvgTag =
  | 'path'
  | 'line'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'polyline'
  | 'polygon'

export interface SvgElement {
  tag: SvgTag
  /** Raw SVG attribute names: `d`, `x1`, `stroke-linecap`, etc. */
  attrs: Record<string, string | number>
  /**
   * If present, the element animates via `variants[key]`. If absent the
   * element renders as plain SVG (static).
   */
  key?: string
  /**
   * Optional morph target chain. When provided AND morphing is enabled,
   * the element is rendered through `<MorphPath>` which uses flubber to
   * interpolate the `d` attribute through `paths[0] → paths[1] → …` over
   * the variant's transition. `paths[0]` is the resting state; the chain
   * advances as the trigger goes 'initial' → 'animate'. Two-element chain
   * is the common case (resting ↔ deformed). Only valid for `tag: 'path'`.
   */
  paths?: string[]
}

export interface VariantSet {
  initial: Record<string, unknown>
  animate: Record<string, unknown>
}

export interface Proposal {
  /** ≤ 4 words. */
  title: string
  /** 1-2 sentences explaining what moves and why. */
  description: string
  elements: SvgElement[]
  variants: Record<string, VariantSet>
}

export type ModelTier = 'sonnet' | 'opus'

export interface UsageInfo {
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  output_tokens: number
}

export interface CostBreakdown {
  /** Pre-cache discount input cost (uncached tokens × base rate). */
  input_usd: number
  /** Cache write premium (1.25× base). */
  cache_write_usd: number
  /** Cache read discount (0.1× base). */
  cache_read_usd: number
  output_usd: number
  total_usd: number
}

export interface RunResult {
  tier: ModelTier
  proposals: Proposal[]
  verdicts: CheapVerdict[]
  usage: UsageInfo
  cost: CostBreakdown
  /** True if this run was triggered by automatic Sonnet → Opus escalation. */
  autoEscalated: boolean
}

export interface GenerateRequest {
  iconName: string
  /**
   * Which tier to use. Default: `'sonnet'` with auto-escalation.
   * - `'sonnet'`: try Sonnet 4.6 first, auto-escalate to Opus 4.7 if ≥2 of 3
   *   proposals are flagged by the cheap-detector.
   * - `'opus'`: skip Sonnet, go straight to Opus 4.7. Used by the manual
   *   "Regenerate with Opus" button.
   */
  tier?: ModelTier
  /** Override the SVG (e.g. for a Lucide icon not yet in their CDN). */
  svgOverride?: string
  /** Capabilities — see `GenerationOptions`. */
  options?: GenerationOptions
}

export interface GenerationOptions {
  /**
   * Allow Claude to add **auxiliary** elements (sparks, ripples, motion
   * trails) alongside the original Lucide geometry. Aux elements use the
   * key prefix `aux:` so the cheap-detector excludes them from the "≥2 of
   * the source elements move" floor. Capped at 3 aux elements per proposal,
   * stroke-only `currentColor`. Default: false.
   */
  allowSpawning?: boolean
  /**
   * Allow morphing path silhouettes via flubber. When on, Claude may emit
   * `paths: [d1, d2, ...]` on a path element; the renderer interpolates
   * through them. Lets the model deform shape outlines (flame-tip wobble,
   * droplet-to-puddle). Adds runtime cost + flubber dep to icons that use
   * it. Default: false.
   */
  allowMorphing?: boolean
}

export interface GenerateResponse {
  iconName: string
  /** The original Lucide SVG markup, for reference. */
  sourceSvg: string
  /**
   * One entry per model call made for this request. A simple Sonnet generation
   * has one run; an auto-escalation has two (Sonnet then Opus). The client
   * keeps prior runs across manual "Regenerate with Opus" clicks so all
   * proposals stay visible for comparison.
   */
  runs: RunResult[]
}

export interface RefineRequest {
  iconName: string
  /** The proposal the user wants to mutate. */
  base: Proposal
  /** Free-text instruction, e.g. "make the sparkles smaller and slower". */
  instruction: string
  /** Sonnet by default; user may force Opus. */
  tier?: ModelTier
  /** Same capability flags as `GenerateRequest`. */
  options?: GenerationOptions
}

export interface RefineResponse {
  /** The refined proposal, same shape as the base. */
  proposal: Proposal
  verdict: CheapVerdict
  usage: UsageInfo
  cost: CostBreakdown
  tier: ModelTier
}

export interface SelectRequest {
  iconName: string
  proposal: Proposal
}

/**
 * Discriminated union: `written` if we created the SFC, `conflict` if the
 * icon already exists in `src/icons/`. We refuse to overwrite — the client
 * surfaces a warning and offers to export the proposal to `saved_runs/`
 * instead. Real variant-merging is a separate problem we'll tackle later.
 */
export type SelectResponse =
  | { kind: 'written'; iconName: string; filePath: string }
  | { kind: 'conflict'; iconName: string; existingFile: string; existingVariants: string[] }

export interface ExportRequest {
  iconName: string
  proposal: Proposal
  /** Carried through so the JSON file is self-contained for later inspection. */
  verdict: CheapVerdict
  usage: UsageInfo
  cost: CostBreakdown
  tier: ModelTier
}

export interface ExportResponse {
  filePath: string
}

/**
 * Cheap-detector verdict. `passed === false` means we'd reject this proposal
 * before showing it. v1 surfaces all results to the UI for transparency.
 */
export interface CheapVerdict {
  passed: boolean
  reasons: string[]
}

/**
 * One row in `forge/.cost-log.jsonl`. Append-only — every Anthropic call
 * (single-icon, refine, batch generate, batch relevance) writes one line.
 * The batch estimator reads the trailing N for a given `kind` + `tier` to
 * predict cost and wall time before kicking off a batch.
 */
export interface CostLogEntry {
  /** ISO-8601 timestamp. */
  ts: string
  tier: ModelTier
  kind: 'generate' | 'refine' | 'relevance'
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  output_tokens: number
  total_usd: number
  /** Wall time of the Anthropic call, milliseconds. */
  wall_ms: number
  /** Icon name for `generate` / `refine`; absent for `relevance`. */
  icon?: string
}

export interface RelevancePick {
  name: string
  reason: string
}

export interface BatchCandidatesRequest {
  /** How many candidates to surface. */
  n: number
  /** Default 'sonnet'. Ranking is name-only and cheap; opus rarely worth it. */
  tier?: ModelTier
}

export interface BatchCandidatesResponse {
  picks: RelevancePick[]
  /** Total Lucide icons upstream. */
  total_lucide: number
  /** Lucide icons not yet in our library (the pool the picks came from). */
  missing_count: number
  /** Cost of the relevance call alone, in USD. */
  cost_usd: number
  wall_ms: number
  tier: ModelTier
}

/**
 * Per-row state in a batch run. Rows progress
 *   pending → fetching → generating → ready
 * with `failed` as a terminal alternative if the model call throws.
 */
export type BatchRowStatus =
  | 'pending'
  | 'fetching'
  | 'generating'
  | 'ready'
  | 'failed'

export interface BatchRow {
  iconName: string
  /** Why the relevance ranker picked this icon. */
  reason: string
  status: BatchRowStatus
  sourceSvg?: string
  proposals?: Proposal[]
  verdicts?: CheapVerdict[]
  usage?: UsageInfo
  cost?: CostBreakdown
  /**
   * Card indices the user selected, in selection order. The first entry
   * becomes `default`; subsequent entries become `alt`, `alt-2`, … when the
   * proposals merge cleanly into one multi-variant SFC, or `<base>-2`,
   * `<base>-3` standalone files when shapes diverge.
   */
  selectedIndices?: number[]
  /** While a refine is in flight for one of the three cards, holds its index. */
  refiningCard?: number | null
  /** Set if `status === 'failed'`. */
  error?: string
}

export type BatchStatus =
  | 'pending'
  | 'ranking'
  | 'generating'
  | 'done'
  | 'cancelled'
  | 'error'

export interface BatchState {
  id: string
  /** ISO-8601. */
  createdAt: string
  status: BatchStatus
  /** Target row count requested by the user. */
  n: number
  tier: ModelTier
  options: GenerationOptions
  concurrency: number
  rows: BatchRow[]
  /** Total Lucide icons upstream at start time. */
  totalLucide: number
  /** Missing-from-library count at start time. */
  missingCount: number
  rankingCostUsd: number
  /** Sum of cost across rows whose status === 'ready'. */
  generationCostUsd: number
  /** Top-level error if the orchestrator itself fails. */
  error?: string
  /** Bumped on every mutation; SSE clients can use it to dedupe. */
  version: number
}

export interface BatchStartRequest {
  n: number
  tier?: ModelTier
  options?: GenerationOptions
  /** Defaults to 5; clamped to [1, 10]. */
  concurrency?: number
}

export interface BatchStartResponse {
  batchId: string
}

export interface BatchListEntry {
  id: string
  createdAt: string
  status: BatchStatus
  n: number
  rowCount: number
  readyCount: number
  selectedCount: number
}

export interface BatchSelectRequest {
  rowIndex: number
  /**
   * Replacement selection state for the row, in pick order. Empty array
   * clears the selection; `[1]` picks card 1; `[0, 2]` picks cards 0 then 2
   * (card 0 becomes the default variant).
   */
  selectedIndices: number[]
}

export interface BatchSaveRequest {
  /** If omitted, save every row that has a non-null selection. */
  rowIndices?: number[]
}

export interface BatchSaveResult {
  rowIndex: number
  iconName: string
  outcome:
    | {
        kind: 'written'
        /** One entry per SFC file written. Single-variant rows have one entry. */
        files: Array<{
          filePath: string
          /** Variant names baked into this SFC (≥1; e.g. ['default'] or ['default','alt']). */
          variants: string[]
        }>
        /** True when multi-select merged into one multi-variant SFC. */
        merged: boolean
      }
    | { kind: 'conflict'; existingFile: string; existingVariants: string[] }
    | { kind: 'skipped'; reason: string }
    | { kind: 'failed'; error: string }
}

export interface BatchSaveResponse {
  results: BatchSaveResult[]
}
