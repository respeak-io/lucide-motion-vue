import Anthropic from '@anthropic-ai/sdk'
import type { ModelTier, UsageInfo } from './schema'
import { computeCost } from './pricing'
import { logCost } from './cost-log'

export interface RelevancePick {
  name: string
  /** ≤ 8 words. Why this icon is animation-worthy. */
  reason: string
}

export interface RelevanceResult {
  picks: RelevancePick[]
  usage: UsageInfo
  cost: { total_usd: number }
  wall_ms: number
  tier: ModelTier
}

let _client: Anthropic | undefined
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

const SYSTEM = `You curate which Lucide icon names are most rewarding to animate.

Animation-worthy means the icon represents something that would feel more alive with a simple gesture — a shake, pulse, path-draw, rotate, or sway. Strong picks:
- Verbs / actions: download, upload, refresh, send, search, save, copy, scissors, hammer
- State-change / reactive UI: bell, lock, eye, wifi, battery, volume, play/pause, heart, star
- Familiar objects with a natural motion: leaf (sway), drop (fall), feather (drift), bell (ring), key (turn), umbrella (open)
- Things with internal moving parts: clock, hourglass, fan, gear, scale, scissors

Avoid:
- Pure geometric primitives (square, circle, triangle, hexagon) and abstract glyphs with no metaphor
- Static-by-nature objects (apple, banana, cake) unless the metaphor invites motion (e.g. apple-bite-out)
- Numbered / lettered glyphs (a-large-small, 1, 2, 3-circle)
- Brand/logo icons that read as identity, not action
- Compound icons that are just "<base> + check/plus/minus" — pick the base instead

Output strict JSON: {"picks": [{"name": "...", "reason": "..."}, ...]} ranked best first. Reasons must be ≤ 8 words and describe what kind of motion suits the icon (e.g. "rings on tap", "pulses with notifications", "draws stroke on hover"). Output ONLY the JSON object.`

export async function selectRelevantIcons(
  candidates: string[],
  n: number,
  tier: ModelTier = 'sonnet',
): Promise<RelevanceResult> {
  if (n < 1) throw new Error(`selectRelevantIcons: n must be ≥ 1, got ${n}`)
  if (candidates.length === 0) {
    throw new Error('selectRelevantIcons: candidates list is empty')
  }
  const target = Math.min(n, candidates.length)

  const userPrompt = `From this list of ${candidates.length} Lucide icon names not yet in our animated library, pick the ${target} most animation-worthy. Rank best first.

\`\`\`
${candidates.join('\n')}
\`\`\`

Return JSON: {"picks": [{"name": "<exact-kebab>", "reason": "<≤8 words>"}, ...]}. Names MUST be from the list above, exact spelling.`

  const startedAt = Date.now()
  const message =
    tier === 'opus'
      ? await getClient().messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 8000,
          system: SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        })
      : await getClient().messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        })
  const wall_ms = Date.now() - startedAt

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { text: string }).text)
    .join('\n')

  const usage: UsageInfo = {
    input_tokens: message.usage.input_tokens ?? 0,
    cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
    output_tokens: message.usage.output_tokens ?? 0,
  }
  const cost = computeCost(tier, usage)

  void logCost({
    ts: new Date().toISOString(),
    tier,
    kind: 'relevance',
    input_tokens: usage.input_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens,
    output_tokens: usage.output_tokens,
    total_usd: cost.total_usd,
    wall_ms,
  }).catch(err => console.error('[forge-api] cost-log write failed:', err))

  const picks = parsePicks(text, candidates, target)
  return { picks, usage, cost: { total_usd: cost.total_usd }, wall_ms, tier }
}

function parsePicks(
  text: string,
  candidates: string[],
  target: number,
): RelevancePick[] {
  let raw = text.trim()
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fence) raw = fence[1].trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      console.log('[forge] relevance raw response (no JSON):\n', text)
      throw new Error('No JSON in relevance response.')
    }
    parsed = JSON.parse(m[0])
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { picks?: unknown }).picks)
  ) {
    throw new Error('Relevance response missing `picks` array.')
  }
  const picks = (parsed as { picks: RelevancePick[] }).picks

  // Defensive filter: drop hallucinated names. Keep at most `target` valid picks.
  const candidateSet = new Set(candidates)
  const seen = new Set<string>()
  const valid: RelevancePick[] = []
  for (const p of picks) {
    if (typeof p?.name !== 'string' || typeof p?.reason !== 'string') continue
    if (!candidateSet.has(p.name)) continue
    if (seen.has(p.name)) continue
    seen.add(p.name)
    valid.push({ name: p.name, reason: p.reason })
    if (valid.length >= target) break
  }
  if (valid.length === 0) {
    throw new Error('Relevance response had no valid picks.')
  }
  return valid
}
