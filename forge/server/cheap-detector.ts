import type { Proposal, CheapVerdict, VariantSet } from './schema'

export interface CheapDetectorOptions {
  /**
   * The source icon has a single animatable element (most commonly a single
   * `<path>` — `flame`, `brush`, `droplet`). The "≥2 moving variants" floor
   * doesn't apply: a one-path icon legitimately has only one variant to
   * animate, and forcing Claude to add a fake second variant produces grey
   * "inner core" ghosts that don't fit the outline-only library aesthetic.
   * The magnitude floor still applies though — sub-visible motion is sub-
   * visible regardless of how many parts the icon has.
   */
  singlePath?: boolean
}

/**
 * Programmatic floor on animation quality. Catches three failure modes:
 *
 * 1. **Too few moving parts** — `brush` / `bell.lucide-animated`'s "one
 *    rotate on group, every other variant empty" trick.
 * 2. **Sub-visible magnitude** — Claude clearing the variant-count rule by
 *    adding `scale: [1, 1.02]` or `opacity: [1, 0.95]`. Technically passes
 *    "≥2 variants move", actually reads as "nothing happens".
 * 3. **Block wiggle** — every variant is rotate-only, so the whole icon
 *    rotates as one piece (the `brush` failure mode).
 * 4. **Synchronous timing** — every variant shares duration and zero delay,
 *    so motion reads as mechanical instead of organic.
 */
export function detectCheap(
  proposal: Proposal,
  opts: CheapDetectorOptions = {},
): CheapVerdict {
  const reasons: string[] = []
  const variantEntries = Object.entries(proposal.variants)
  const moving = variantEntries.filter(([, v]) => isVariantNonEmpty(v))
  const visible = moving.filter(([, v]) => isVariantVisible(v))

  // Aux variants (key prefix `aux:`) are spawned decorative elements (sparks,
  // ripples). They count as motion for the visibility check (their magnitude
  // still has to clear the floor) but they don't satisfy the "≥2 source
  // elements move" rule on multi-element icons — otherwise Claude could
  // duck the rule by spawning two static-looking sparks instead of moving
  // the actual icon.
  const visibleSource = visible.filter(([k]) => !k.startsWith('aux:'))

  const minVisible = opts.singlePath ? 1 : 2
  const sourceCount = opts.singlePath ? visible.length : visibleSource.length

  if (moving.length === 0) {
    reasons.push('No variant has any motion.')
  } else if (sourceCount < minVisible) {
    const subVisible = moving.length - visible.length
    if (subVisible > 0 && moving.length >= minVisible) {
      reasons.push(
        `${subVisible} of ${moving.length} variant(s) animate below the visibility floor (rotate <5°, scale <0.1, opacity <0.3, translate <2u, pathLength <0.3). Motion would barely register.`,
      )
    } else {
      const auxNote = visible.length > visibleSource.length
        ? ` (${visible.length - visibleSource.length} aux:* variant(s) ignored for this rule)`
        : ''
      reasons.push(
        `Only ${sourceCount} source element(s) animate visibly — at least ${minVisible} required for ${opts.singlePath ? 'single-element' : 'multi-element'} icons${auxNote}.`,
      )
    }
  }

  // Block-wiggle check only makes sense for multi-element icons. A single-path
  // icon that rotates around a sensible anchor (clock hand, compass needle)
  // is a legit pattern, not a block wiggle.
  if (!opts.singlePath) {
    const allRotateOnly = moving.length > 0 && moving.every(
      ([, v]) => onlyHasKeys(v.animate, ['rotate', 'transformOrigin', 'transition']),
    )
    if (allRotateOnly) {
      reasons.push('All motion is rotate-only — looks like a block wiggle.')
    }
  }

  // Synchronous timing — only meaningful with ≥2 moving variants.
  if (moving.length >= 2) {
    const durations = moving
      .map(([, v]) => readDuration(v))
      .filter((d): d is number => typeof d === 'number')
    const delays = moving
      .map(([, v]) => readDelay(v))
      .filter((d): d is number => typeof d === 'number')
    if (
      durations.length === moving.length &&
      new Set(durations).size === 1 &&
      delays.every(d => d === 0 || delays.length === 0)
    ) {
      reasons.push(
        'All moving parts share the same duration and no staggered delay — feels synchronous.',
      )
    }
  }

  return { passed: reasons.length === 0, reasons }
}

function isVariantNonEmpty(v: VariantSet): boolean {
  return Object.keys(v.animate ?? {}).length > 0
}

function onlyHasKeys(obj: Record<string, unknown>, allowed: string[]): boolean {
  const allowSet = new Set(allowed)
  return Object.keys(obj).every(k => allowSet.has(k))
}

function readDuration(v: VariantSet): number | undefined {
  const t = (v.animate as Record<string, unknown>)?.transition as
    | Record<string, unknown>
    | undefined
  return typeof t?.duration === 'number' ? t.duration : undefined
}

function readDelay(v: VariantSet): number | undefined {
  const t = (v.animate as Record<string, unknown>)?.transition as
    | Record<string, unknown>
    | undefined
  return typeof t?.delay === 'number' ? t.delay : 0
}

/**
 * Per-property visibility floors. A variant counts as "visible" if at least
 * one of its animated props clears its floor — variants that pair a tiny
 * rotate with a big pathLength still count.
 *
 * Numbers are tuned to "would a human notice this in a 1-second loop?":
 * scale 1→1.02 won't, scale 1→1.10 will. Calibrate further if forge spits
 * out cards that pass these floors but still look static.
 */
const MAGNITUDE_FLOORS: Record<string, number> = {
  rotate: 5,
  scale: 0.1,
  scaleX: 0.1,
  scaleY: 0.1,
  opacity: 0.3,
  x: 2,
  y: 2,
  translateX: 2,
  translateY: 2,
  pathLength: 0.3,
  pathOffset: 0.3,
  pathSpacing: 0.3,
  width: 2,
  height: 2,
  cx: 2,
  cy: 2,
  r: 1,
  strokeWidth: 0.5,
  'stroke-width': 0.5,
}

function isVariantVisible(v: VariantSet): boolean {
  const animate = v.animate as Record<string, unknown> | undefined
  const initial = (v.initial ?? {}) as Record<string, unknown>
  if (!animate) return false

  for (const [key, val] of Object.entries(animate)) {
    if (key === 'transition' || key === 'transformOrigin') continue
    if (clearsFloor(key, val, initial[key])) return true
  }
  return false
}

function clearsFloor(key: string, animateVal: unknown, initialVal: unknown): boolean {
  const floor = MAGNITUDE_FLOORS[key]
  // Unknown property — assume it animates something visible (e.g. fill,
  // stroke colour, custom path). Conservative: don't reject what we can't
  // measure.
  if (floor === undefined) return true

  const range = magnitudeRange(animateVal, initialVal)
  if (range === undefined) return true // e.g. string colour value
  return range >= floor
}

function magnitudeRange(animateVal: unknown, initialVal: unknown): number | undefined {
  const animateNums = toNumberArray(animateVal)
  if (!animateNums) return undefined
  const initNum = typeof initialVal === 'number' ? initialVal : undefined
  const all = initNum !== undefined ? [...animateNums, initNum] : animateNums
  if (all.length === 0) return undefined
  return Math.max(...all) - Math.min(...all)
}

function toNumberArray(v: unknown): number[] | undefined {
  if (typeof v === 'number') return [v]
  if (Array.isArray(v)) {
    const nums = v.filter(x => typeof x === 'number') as number[]
    return nums.length > 0 ? nums : undefined
  }
  return undefined
}
