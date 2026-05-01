#!/usr/bin/env node
/**
 * Sweep every SFC's `lucide-animated` (or `alt`) variant body and flag
 * suspicious patterns:
 *   - all entries empty: variant ships nothing
 *   - lone non-empty entry surrounded by empty siblings: fan-case where
 *     pqoqubbw .map() collapsed but augment never fanned the body
 *   - raw `(i: number) =>` with no surrounding IIFE: dynamic variant body
 *     that needs `custom` propagation but won't get it (Augment's old
 *     bug; should be fully fixed but worth verifying)
 *   - explicit `translateX:` / `translateY:` keys: stale before the
 *     normalisation pass
 *
 * Groups results by source kind so we can sample one representative
 * from each category for visual review.
 *
 * Run: node scripts/_audit-lucide-animated.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS_DIR = join(ROOT, 'src/icons')

function balancedEnd(src, startIdx, open = '{', close = '}') {
  let depth = 0, inStr = null
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i]
    if (inStr) { if (c === '\\') { i++; continue } if (c === inStr) inStr = null; continue }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
    if (c === open) depth++
    else if (c === close) { depth--; if (depth === 0) return i + 1 }
  }
  return -1
}

function classify(src, kebab) {
  if (src.includes('Multi-variant icon')) return 'multi-variant'
  if (src.includes('Auto-generated from animate-ui')) return 'augment'
  if (src.includes('Auto-generated from pqoqubbw')) return 'fresh-pq'
  if (src.includes('Hand-ported') || src.includes('Hand-written')) return 'hand'
  return 'other'
}

function findVariantBody(src, name) {
  // Locate `<name>:` at depth 1 inside `const animations = { ... }` or
  // `const animations: MultiVariantAnimations = { ... }`.
  const animMatch = src.match(/const\s+animations\b[^=]*=\s*\{/)
  if (!animMatch) return null
  const animStart = animMatch.index + animMatch[0].length - 1
  const animEnd = balancedEnd(src, animStart)
  if (animEnd < 0) return null
  const block = src.slice(animStart, animEnd)
  // Look for `'name':` or `"name":` at depth 1.
  const re = new RegExp(`(\\n\\s+)['\"]?${name.replace(/[-]/g, '\\-')}['\"]?\\s*:\\s*\\{`)
  const m = block.match(re)
  if (!m) return null
  const headerEnd = m.index + m[0].length - 1
  const bodyEnd = balancedEnd(block, headerEnd)
  if (bodyEnd < 0) return null
  return block.slice(headerEnd, bodyEnd)
}

function entriesIn(body) {
  // body starts with `{` and ends with `}`.
  // Return list of { key, raw } at depth 1.
  const out = []
  if (!body || body[0] !== '{') return out
  let i = 1
  let depth = 0, inStr = null
  while (i < body.length - 1) {
    const c = body[i]
    if (inStr) { if (c === '\\') { i += 2; continue } if (c === inStr) inStr = null; i++; continue }
    if (c === '"' || c === "'" || c === '`') { inStr = c; i++; continue }
    if (c === '{' || c === '(' || c === '[') { depth++; i++; continue }
    if (c === '}' || c === ')' || c === ']') { depth--; i++; continue }
    if (depth !== 0) { i++; continue }
    const km = body.slice(i).match(/^\s*['\"]?([A-Za-z_][\w-]*)['\"]?\s*:\s*/)
    if (!km) { i++; continue }
    const valueStart = i + km[0].length
    let j = valueStart, vDepth = 0, vStr = null
    while (j < body.length) {
      const cc = body[j]
      if (vStr) { if (cc === '\\') { j += 2; continue } if (cc === vStr) vStr = null; j++; continue }
      if (cc === '"' || cc === "'" || cc === '`') { vStr = cc; j++; continue }
      if (cc === '{' || cc === '(' || cc === '[') { vDepth++; j++; continue }
      if (cc === '}' || cc === ')' || cc === ']') { if (vDepth === 0) break; vDepth--; j++; continue }
      if (vDepth === 0 && cc === ',') break
      j++
    }
    out.push({ key: km[1], raw: body.slice(valueStart, j).trim() })
    i = j + 1
  }
  return out
}

function isEmpty(raw) { return /^\{\s*\}$/.test(raw) }

/** Multi-variant icons can keep a dynamic variant body when every keyed
 * element carries its own literal `custom` attribute — that's motion-v's
 * canonical `custom` prop pattern (cast's wifi arcs, message-circle-more's
 * three typing dots: each path keyed `part` or `dot` with `custom: 0.1`,
 * `custom: 0.2`, etc.). The function variant is invoked per-element with
 * the literal custom value, producing the correct stagger. We don't bake
 * those — augment-style fan-baking is only for templates that have no
 * way to forward `:custom` per element. */
function isCustomPatternBody(elementsRaw, varKey) {
  if (!elementsRaw) return false
  // Loose heuristic: the elements literal contains both a numeric `custom:`
  // attr and a `key: "<varKey>"` reference. Good enough — false positives
  // here mean we *under-flag* (acceptable; visually verifying the icon is
  // cheap), not over-flag.
  const hasCustom = /\bcustom:\s*-?\d+(?:\.\d+)?/.test(elementsRaw)
  const hasKey = new RegExp(`\\bkey:\\s*['\"]${varKey}['\"]`).test(elementsRaw)
  return hasCustom && hasKey
}
function isDynamicUnbaked(raw) {
  // `animate: (i: number) => ({ ... })` not wrapped in `((...))(N)`. Two
  // shapes are valid baked output:
  //   animate: ((i: number) => ({ ... }))(N),
  //   animate: ((custom: number) => ({ ... }))(0),
  // The unbaked shape is `animate: (i: number) => ({ ... }),` — the arrow
  // sits at the top of the property value with no leading `((` before
  // the param list. Match the unbaked-only form.
  // Look for `animate:` followed by whitespace then `(` (param paren),
  // and assert that the char before `animate:` is NOT also `(`.
  const idx = raw.search(/\banimate\s*:\s*\(/)
  if (idx < 0) return false
  // Look for `((` preceding the params via the colon's right-hand side.
  // After `animate:`, skip whitespace; if next is `((`, it's wrapped.
  const after = raw.slice(idx).match(/\banimate\s*:\s*(\(\(?)/)
  return after && after[1] === '(' // single `(` means unbaked
}
function hasTranslateXY(raw) { return /\btranslate[XY]\s*:/.test(raw) }

const groups = { augment: [], 'multi-variant': [], 'fresh-pq': [], hand: [], other: [] }
const flags = []

const files = readdirSync(ICONS_DIR).filter(f => f.endsWith('.vue'))
for (const file of files) {
  const kebab = file.replace(/\.vue$/, '')
  const src = readFileSync(join(ICONS_DIR, file), 'utf8')
  const kind = classify(src, kebab)
  groups[kind].push(kebab)

  // pick the variant we care about
  let variantName = null
  if (kind === 'multi-variant') variantName = 'alt'
  else if (src.includes("'lucide-animated':")) variantName = 'lucide-animated'
  else if (src.includes("'lucide-animated-loop':")) variantName = 'lucide-animated-loop'
  if (!variantName) continue

  const body = findVariantBody(src, variantName)
  if (!body) {
    flags.push({ kebab, kind, issue: `couldn't extract '${variantName}' body`, severity: 'parse' })
    continue
  }
  const entries = entriesIn(body)
  if (entries.length === 0) {
    flags.push({ kebab, kind, issue: 'no entries', severity: 'high' })
    continue
  }

  // For multi-variant, the body has shape `{ elements: [...], variants: { ... } }`.
  // The variants block is what we audit for empty/unbaked entries.
  let varEntries = entries
  let elementsRaw = null
  if (kind === 'multi-variant') {
    const vEntry = entries.find(e => e.key === 'variants')
    if (!vEntry) { flags.push({ kebab, kind, issue: 'no `variants` key in alt', severity: 'high' }); continue }
    const elEntry = entries.find(e => e.key === 'elements')
    elementsRaw = elEntry?.raw || null
    let varRaw = vEntry.raw.replace(/\s+as\s+[^,]+$/, '').trim()
    if (varRaw.startsWith('(')) { continue }
    varEntries = entriesIn(varRaw)
  }

  const total = varEntries.length
  const empty = varEntries.filter(e => isEmpty(e.raw)).length
  const unbaked = varEntries.filter(e => isDynamicUnbaked(e.raw))
  const translateXY = varEntries.filter(e => hasTranslateXY(e.raw))

  if (total > 0 && empty === total) {
    flags.push({ kebab, kind, issue: 'all entries empty', severity: 'high' })
  }
  if (total >= 3 && empty >= total - 1 && empty > 0) {
    // Lone non-empty surrounded by empties — possible un-fanned case.
    const nonEmpty = varEntries.filter(e => !isEmpty(e.raw))
    if (nonEmpty.length === 1 && isDynamicUnbaked(nonEmpty[0].raw)) {
      flags.push({ kebab, kind, issue: `un-fanned dynamic (only ${nonEmpty[0].key} animates, ${empty} empty siblings)`, severity: 'high' })
    }
  }
  if (unbaked.length) {
    // Multi-variant icons may legitimately keep dynamic variants when
    // every keyed element supplies its own literal `custom` prop.
    const trueUnbaked = unbaked.filter(e =>
      !(kind === 'multi-variant' && elementsRaw && isCustomPatternBody(elementsRaw, e.key))
    )
    if (trueUnbaked.length) {
      flags.push({ kebab, kind, issue: `unbaked dynamic body: ${trueUnbaked.map(e => e.key).join(',')}`, severity: 'high' })
    }
  }
  if (translateXY.length) {
    flags.push({ kebab, kind, issue: `translateX/Y still present: ${translateXY.map(e => e.key).join(',')}`, severity: 'medium' })
  }
}

console.log('=== group sizes ===')
for (const [k, list] of Object.entries(groups)) console.log(`  ${k.padEnd(15)} ${list.length}`)
console.log()
console.log(`=== flagged (${flags.length}) ===`)
flags.sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1))
for (const f of flags) {
  console.log(`  [${f.severity}] ${f.kind.padEnd(15)} ${f.kebab.padEnd(28)} ${f.issue}`)
}
