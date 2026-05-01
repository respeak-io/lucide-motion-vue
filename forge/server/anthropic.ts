import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Proposal, ModelTier, UsageInfo, GenerationOptions } from './schema'
import { extractElements, formatGeometryBlock } from './svg-geometry'

export interface GenerationOutput {
  proposals: Proposal[]
  usage: UsageInfo
}

const HERE = dirname(fileURLToPath(import.meta.url))
const STYLE_GUIDE_PATH = join(HERE, '../style-guide.md')

let cachedStyleGuide: string | undefined
async function loadStyleGuide(): Promise<string> {
  if (!cachedStyleGuide) {
    cachedStyleGuide = await readFile(STYLE_GUIDE_PATH, 'utf8')
  }
  return cachedStyleGuide
}

// Lazy-init: the env loader in api-plugin.ts runs AFTER this module is
// imported, so we can't construct the client at module-load time — it would
// read process.env before .env has been populated.
let _client: Anthropic | undefined
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

const PREAMBLE = `You are an icon-animation designer for a Vue + motion-v icon library. Given a Lucide source SVG, you produce exactly 3 DISTINCT animation proposals as strict JSON. The style guide below is binding — every proposal must clear its bar before being shown to a maintainer for review.`

const MULTI_ELEMENT_PLAYBOOK = `This icon has **multiple animatable elements**. The "≥2 moving variants with materially different motion" rule from the style guide applies. Look for elements you can move independently — the bell clapper vs. the bell rim, the wand body vs. the sparkles, the plane vs. the speed lines. Phase-offset their timings (different durations and/or staggered delays) so the icon doesn't feel mechanical.`

const SINGLE_ELEMENT_PLAYBOOK = `This icon has a **single animatable element** — the "≥2 moving variants" rule does NOT apply. Force-adding a second variant by duplicating the path produces grey "inner core" ghosts that don't fit the outline-only library aesthetic. Don't do that.

Anchor coordinates for \`transform-origin\`: the geometry block above gives you both \`centroid=(x,y)\` (the visual middle) and \`base=(x,y)\` (the bottom-center). For breathe / sway / grow / flicker, **always use \`base\`** — anchoring at the centroid makes the shape pulse from its middle, which reads as floating instead of grounded. Use \`centroid\` only for full-body spin / scale-from-center.

Single-element playbook (pick one technique per proposal, vary across the 3):
- **pathLength** (0 → 1 inside variants) — draws the silhouette in. Combine with a brief delay then \`opacity\` rest, or run forward then back. Best for "ignites", "appears", "writes itself".
- **Base-anchored scale pulse** — \`scale: [1, 1.10, 1]\` with \`transform-origin\` set to the element's \`base\` from the geometry block. Reads as "breathing" / "growing".
- **Rotate-sway from the base** — \`rotate: [0, -7, 6, -3, 0]\` with \`transform-origin\` at \`base\`. Reads as "in a breeze", "flickering", "wobbling".
- **stroke-width pulse** — \`strokeWidth: [2, 2.6, 2]\` paired with a transform. Reads as "energy", "heartbeat".
- **opacity pulse paired with one of the above** — opacity alone reads as "broken icon"; pair it with motion.

Magnitude floor (sub-visible motion is auto-rejected): rotate <5°, scale <0.1, opacity <0.3, translate <2 units, pathLength <0.3. \`scale: [1, 1.02]\` is too small to see — use \`[1, 1.10]\` or larger.

For continuous loops use \`repeat: Infinity\` (the JSON value \`"Infinity"\` is acceptable — the renderer translates it back to the JS literal). Pair with \`repeatType: "loop"\` or \`"reverse"\`.

Forbidden for single-element icons:
- Inventing a second \`<path>\` (or any duplicate element) to game the variant count. The library renders \`fill="none"\` at the SVG root; duplicate paths show up as visual noise.
- Sub-visible motion to "technically" satisfy a rule.`

const SPAWNING_BLOCK = `
**SPAWNING ENABLED** — you may add **auxiliary** elements (sparks, ripples, motion trails, droplets) that aren't part of the source Lucide geometry. Use them when the icon's metaphor benefits: flame sparks flying off, a bell emitting sound waves, sparkles around a wand, ripples around water.

Rules for auxiliary elements:
- Key prefix \`aux:\` (e.g. \`aux:spark1\`, \`aux:ripple\`). Aux keys are excluded from the "≥2 source elements move" floor — they don't satisfy that rule, they only add to it.
- Cap: max **3** aux elements per proposal. More than that turns the icon into a particle system, not an icon.
- Stroke-only with \`stroke="currentColor"\`. No \`fill\` — the library is outline-only.
- Small: each aux element bbox ≤ 4×4 units. Sparks/ripples are accents, not co-stars.
- Tag: \`circle\`, \`line\`, \`path\` (short), or \`polyline\`. Use \`r\` ≤ 1.5 for circles.
- Aux elements MUST move (have a non-empty variant). Static decorations don't earn their place.
- The source element(s) must still carry the primary motion — aux elements decorate, they don't replace.

Forbidden:
- Duplicating a source path as "aux" to give it a fake second variant. Aux must be visually distinct from any source element.
- Filled aux shapes ("inner core" ghosts).`

const MORPHING_BLOCK = `
**MORPHING ENABLED** — you may deform the silhouette of a path element by providing a \`paths\` array on it. The renderer uses flubber to interpolate between the path strings, so they don't need matching anchor counts (unlike native motion-v path tweens).

How to use:
- On a \`tag: 'path'\` element, set \`paths: ['<initial-d>', '<animate-d>']\`. The element animates by morphing the silhouette across the variant's transition. The first \`d\` shows at \`initial\`, the last shows at \`animate\`.
- Multi-step morph: \`paths: [d1, d2, d3]\` interpolates d1→d2→d3 evenly across the transition.
- The element still gets a \`key\` and a corresponding \`variants[key]\` — the variant's transition (duration, ease, repeat) drives the morph timing.
- The \`attrs.d\` field is **ignored** when \`paths\` is present (the chain wins).

When to reach for it: silhouette wobble (flame tip flickering with subtle shape change), shape transformation (droplet pooling into a puddle, leaf curling), expression changes (smile → frown). When NOT to: anything achievable with transforms, pathLength, or stroke-width — those are cheaper and don't add the flubber dep.

Quality rules:
- The two endpoints should be **visually similar in topology** (one closed silhouette → another closed silhouette of the same family). Wildly different shapes produce ugly midpoints.
- Anchor count mismatch is fine (flubber handles it), but huge geometric differences aren't. Keep both \`d\`s within the same overall bbox.
- One morph element per proposal max. Layered morphs are expensive and rarely improve the design.`

function capabilitySection(options: GenerationOptions): string {
  const blocks: string[] = []
  if (options.allowSpawning) blocks.push(SPAWNING_BLOCK)
  if (options.allowMorphing) blocks.push(MORPHING_BLOCK)
  return blocks.length > 0 ? '\n' + blocks.join('\n') + '\n' : ''
}

export async function generateProposals(
  iconName: string,
  sourceSvg: string,
  tier: ModelTier,
  options: GenerationOptions = {},
): Promise<GenerationOutput> {
  const styleGuide = await loadStyleGuide()
  const userPrompt = buildUserPrompt(iconName, sourceSvg, options)
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: PREAMBLE },
    // Style guide is the bulk of the system prompt — cache it so subsequent
    // icons in the same forge session reuse the prefix at ~10% input cost.
    { type: 'text', text: styleGuide, cache_control: { type: 'ephemeral' } },
  ]

  const response =
    tier === 'opus'
      ? await callOpus(system, userPrompt)
      : await callSonnet(system, userPrompt)

  // Both regular and beta messages share the same `type: "text"` content shape
  // for our purposes — pluck the text fields off without the strict predicate.
  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { text: string }).text)
    .join('\n')

  const usage = normalizeUsage(response.usage)

  console.log('[forge] response', {
    icon: iconName,
    tier,
    stop_reason: response.stop_reason,
    text_chars: text.length,
    has_thinking: response.content.some(b => b.type === 'thinking'),
    usage,
  })

  if (text.length === 0) {
    const blocks = response.content.map(b => b.type)
    throw new Error(
      `Model returned no text for "${iconName}" (tier=${tier}, stop_reason=${response.stop_reason}, blocks=[${blocks.join(', ')}]).` +
        (response.stop_reason === 'max_tokens'
          ? ' Hit max_tokens — output was truncated.'
          : ''),
    )
  }

  const proposals = extractProposals(text, iconName, response.stop_reason ?? null)
  for (const p of proposals) stripDisabledCapabilities(p, options)
  return { proposals, usage }
}

/**
 * Defensive: the model occasionally emits `paths: [...]` (morph chains) or
 * `aux:*` keys even when the corresponding capability block was absent from
 * the prompt. Strip them out here so disabled capabilities can't leak into
 * the preview, persisted batch state, or generated SFC.
 */
function stripDisabledCapabilities(p: Proposal, options: GenerationOptions): void {
  if (!options.allowMorphing) {
    for (const el of p.elements) {
      if (el.paths) delete el.paths
    }
  }
  if (!options.allowSpawning) {
    // Drop aux:* elements + their variant entries.
    const auxKeys = new Set(
      p.elements.filter(e => e.key?.startsWith('aux:')).map(e => e.key as string),
    )
    if (auxKeys.size > 0) {
      p.elements = p.elements.filter(e => !e.key?.startsWith('aux:'))
      for (const k of auxKeys) delete p.variants[k]
    }
  }
}

function normalizeUsage(u: AnyMessage['usage']): UsageInfo {
  return {
    input_tokens: u.input_tokens ?? 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
  }
}

/**
 * Sonnet 4.6 — first-pass model. Up to 64K output (streaming required >16K).
 * `effort: medium` because creative design tasks don't benefit from `high`
 * proportionally and `high` eats more of the budget on thinking.
 */
type AnyMessage = Anthropic.Message | Anthropic.Beta.BetaMessage

async function callSonnet(
  system: Anthropic.TextBlockParam[],
  userPrompt: string,
): Promise<AnyMessage> {
  const stream = getClient().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 48000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })
  return await stream.finalMessage()
}

/**
 * Opus 4.7 — escalation path for icons Sonnet flunked the cheap-detector on.
 * Adds `task_budget` (beta) so the model self-moderates across thinking +
 * output. `effort: xhigh` is Opus 4.7's sweet spot for design / coding tasks.
 */
async function callOpus(
  system: Anthropic.TextBlockParam[],
  userPrompt: string,
): Promise<AnyMessage> {
  const stream = getClient().beta.messages.stream({
    betas: ['task-budgets-2026-03-13'],
    model: 'claude-opus-4-7',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'xhigh',
      task_budget: { type: 'tokens', total: 40000 },
    },
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })
  return await stream.finalMessage()
}

export interface RefineOutput {
  proposal: Proposal
  usage: UsageInfo
}

export async function refineProposal(
  iconName: string,
  sourceSvg: string,
  base: Proposal,
  instruction: string,
  tier: ModelTier,
  options: GenerationOptions = {},
): Promise<RefineOutput> {
  const styleGuide = await loadStyleGuide()
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: PREAMBLE },
    { type: 'text', text: styleGuide, cache_control: { type: 'ephemeral' } },
  ]
  const userPrompt = buildRefinePrompt(iconName, sourceSvg, base, instruction, options)

  const response =
    tier === 'opus'
      ? await callOpus(system, userPrompt)
      : await callSonnet(system, userPrompt)

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { text: string }).text)
    .join('\n')

  const usage = normalizeUsage(response.usage)

  console.log('[forge] refine response', {
    icon: iconName,
    tier,
    stop_reason: response.stop_reason,
    text_chars: text.length,
    usage,
  })

  if (text.length === 0) {
    throw new Error(
      `Model returned no text for refine of "${iconName}" (tier=${tier}, stop_reason=${response.stop_reason}).`,
    )
  }

  const proposal = extractSingleProposal(
    text,
    iconName,
    response.stop_reason ?? null,
  )
  stripDisabledCapabilities(proposal, options)
  return { proposal, usage }
}

function buildRefinePrompt(
  iconName: string,
  svg: string,
  base: Proposal,
  instruction: string,
  options: GenerationOptions,
): string {
  const elements = extractElements(svg)
  const geometry = formatGeometryBlock(elements)
  const playbook = elements.length <= 1
    ? SINGLE_ELEMENT_PLAYBOOK
    : MULTI_ELEMENT_PLAYBOOK
  const capabilityBlocks = capabilitySection(options)
  return `Icon name: \`${iconName}\`

Lucide source SVG:
\`\`\`svg
${svg.trim()}
\`\`\`

Per-element geometry (24×24 viewBox):
\`\`\`
${geometry}
\`\`\`

${playbook}
${capabilityBlocks}
Existing animation proposal you produced earlier:
\`\`\`json
${JSON.stringify(base, null, 2)}
\`\`\`

Refinement instruction from the maintainer:
> ${instruction.trim()}

Apply this change. Keep the spirit of the existing proposal — don't redesign from scratch. Only adjust what the instruction asks for, plus anything immediately required to keep the result coherent (e.g. if a duration changes, related staggered delays may need to follow).

The refined proposal must still clear "The bar" in the style guide.

Output a single JSON object — the refined proposal — with the same shape as the input proposal: \`{ "title": "...", "description": "...", "elements": [...], "variants": {...} }\`. Update \`title\` and \`description\` to reflect the change. Output ONLY the JSON object, no prose, no code fences.`
}

function buildUserPrompt(
  iconName: string,
  svg: string,
  options: GenerationOptions,
): string {
  const elements = extractElements(svg)
  const geometry = formatGeometryBlock(elements)
  const playbook = elements.length <= 1
    ? SINGLE_ELEMENT_PLAYBOOK
    : MULTI_ELEMENT_PLAYBOOK
  const capabilityBlocks = capabilitySection(options)

  return `Icon name: \`${iconName}\` (semantic context — use this to anchor what the icon does and what motion would communicate that meaning).

Lucide source SVG:

\`\`\`svg
${svg.trim()}
\`\`\`

Per-element geometry (24×24 viewBox; index = order of appearance in the source SVG):
\`\`\`
${geometry}
\`\`\`

Use \`centroid\` for \`transform-origin\` whenever you set \`scale\` or \`rotate\` on an element. CSS form on the element's \`style\` attr: \`transform-origin: 5px 8px\`. SVG's default origin is (0,0) of the viewport — NOT the element's center — so omitting this makes the shape slide off-canvas instead of pivoting in place. Elements that share a centroid (e.g. the two strokes of one sparkle) can share a key and a single \`transform-origin\`.

${playbook}
${capabilityBlocks}
Produce exactly 3 distinct animation proposals. Output a single JSON object with the shape:

\`\`\`json
{
  "proposals": [
    { "title": "...", "description": "...", "elements": [...], "variants": {...} },
    ...
  ]
}
\`\`\`

Hard requirements:
- Every proposal must clear "The bar" in the style guide. Do NOT submit a proposal with only one moving variant or all-rotate-only motion.
- The 3 proposals must explore distinct ideas — different metaphors, not different parameter values.
- Preserve the original Lucide path geometry. You may split a path along existing M-segments to animate parts independently, but do not redraw shapes.
- Use plain SVG attribute names (\`stroke-linecap\`, \`stroke-linejoin\`, \`stroke-width\`) inside \`attrs\`.
- For variants, prefer multi-keyframe arrays and phase-offset durations between elements that should feel physically independent.

Output ONLY the JSON object. No prose before or after. No markdown code fences in the final response — just the raw JSON object starting with \`{\`.`
}

function extractProposals(
  text: string,
  iconName: string,
  stopReason: string | null,
): Proposal[] {
  // Try direct parse first (the strict path).
  let raw = text.trim()
  // Strip a code fence if the model used one despite instructions.
  const fenceMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fenceMatch) raw = fenceMatch[1].trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    // Fallback: find the first {...} block.
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      // Dump the full text so the next iteration can see exactly what came back.
      console.log('[forge] raw response (no JSON found):\n', text)
      throw new Error(
        `No JSON in response for "${iconName}" (stop_reason=${stopReason}). ` +
          `Got ${text.length} chars of text. First 200 chars: ${JSON.stringify(text.slice(0, 200))}`,
      )
    }
    try {
      parsed = JSON.parse(m[0])
    } catch (innerErr) {
      console.log('[forge] raw response (invalid JSON):\n', text)
      const msg = innerErr instanceof Error ? innerErr.message : String(innerErr)
      throw new Error(
        `Found JSON-like text but parse failed for "${iconName}" (stop_reason=${stopReason}): ${msg}. ` +
          (stopReason === 'max_tokens'
            ? 'Likely truncated by max_tokens.'
            : 'See server log for full response.'),
      )
    }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { proposals?: unknown }).proposals)
  ) {
    throw new Error(`Response missing "proposals" array for icon "${iconName}"`)
  }

  const proposals = (parsed as { proposals: Proposal[] }).proposals
  if (proposals.length !== 3) {
    throw new Error(
      `Expected 3 proposals for "${iconName}", got ${proposals.length}`,
    )
  }
  for (const p of proposals) validateProposalShape(p, iconName)
  return proposals
}

function extractSingleProposal(
  text: string,
  iconName: string,
  stopReason: string | null,
): Proposal {
  let raw = text.trim()
  const fenceMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fenceMatch) raw = fenceMatch[1].trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      console.log('[forge] raw refine response (no JSON):\n', text)
      throw new Error(
        `No JSON in refine response for "${iconName}" (stop_reason=${stopReason}).`,
      )
    }
    parsed = JSON.parse(m[0])
  }

  // Refine returns a single proposal, not the {proposals: [...]} envelope.
  // Allow either shape — model sometimes wraps anyway.
  const proposal =
    parsed && typeof parsed === 'object' && 'proposals' in parsed
      ? (parsed as { proposals: Proposal[] }).proposals[0]
      : (parsed as Proposal)

  validateProposalShape(proposal, iconName)
  return proposal
}

function validateProposalShape(p: Proposal, iconName: string): void {
  const missing: string[] = []
  if (typeof p.title !== 'string') missing.push('title')
  if (typeof p.description !== 'string') missing.push('description')
  if (!Array.isArray(p.elements)) missing.push('elements')
  if (!p.variants || typeof p.variants !== 'object') missing.push('variants')
  if (missing.length > 0) {
    throw new Error(
      `Proposal for "${iconName}" missing fields: ${missing.join(', ')}`,
    )
  }
  // Verify every keyed element has a matching variant entry.
  for (const el of p.elements) {
    if (el.key && !p.variants[el.key]) {
      throw new Error(
        `Element key "${el.key}" has no matching variants entry for "${iconName}"`,
      )
    }
  }
}
