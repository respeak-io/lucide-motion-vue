/**
 * build-css-exports.mjs — generate self-contained CSS-only versions of the
 * icon animations that translate FAITHFULLY to plain CSS (no JS, no deps).
 *
 * This is deliberately conservative: it only emits a variant when we can
 * confidently reproduce it with `@keyframes` + `transition`. Anything that
 * needs real JS — `d`-morphs (different point counts), spring physics,
 * `MultiVariantIcon` geometry, dynamic `custom` stagger functions, or a prop
 * we don't have a CSS mapping for — is recorded with a reason and surfaced in
 * the docs as "needs the component" instead of a copy button.
 *
 * Outputs:
 *   docs/generated/css-export-index.ts   small status map (kebab -> variant -> status)
 *   docs/public/css-exports.json         { "kebab|variant": "<svg>…</svg>\n<style>…</style>" }
 *
 * The audit page (docs/css-audit.html) renders every mechanically-`ok` variant
 * side by side against the real component so a human can cull the ones that
 * don't look right; add those to EXCLUDE below and rerun.
 *
 * Run:  node scripts/build-css-exports.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS_DIR = join(ROOT, 'src/icons')

// (kebab, variant) pairs to force out of the portable set after human review.
// Format: 'kebab' (all variants) or 'kebab:variant'.
const EXCLUDE = new Set([
  // Culled after human review of the audit page (see docs/css-audit.html).
  // Use 'kebab' to drop all variants, or 'kebab:variant' for one.
  // (Cleared for a fresh review after the bound-geometry fix — 2026-06-08.)
])

// Global pace for the exported CSS. The lib's defaults are snappy (~0.3s);
// the copy-paste versions read better a touch slower. 1 = exact lib timing;
// >1 slows everything proportionally (durations + delays), preserving each
// animation's choreography. Tune to taste.
const SPEED_SCALE = 1.3

// Props we can faithfully reproduce in CSS. Anything else => not portable.
const TRANSFORM_PROPS = new Set(['x', 'y', 'translateX', 'translateY', 'scale', 'scaleX', 'scaleY', 'rotate'])
const ORIGIN_PROPS = new Set(['transformOrigin', 'originX', 'originY'])
const DRAW_PROPS = new Set(['pathLength', 'pathOffset'])
const PAINT_PROPS = new Set(['opacity', 'fill', 'fillOpacity', 'strokeWidth'])
const PORTABLE = new Set([...TRANSFORM_PROPS, ...ORIGIN_PROPS, ...DRAW_PROPS, ...PAINT_PROPS])

// SVG geometry/paint attrs we copy verbatim from the template element.
const GEOM_ATTRS = ['d', 'points', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height']
// Coordinate attrs whose value must be a plain number — used to skip prop
// bindings (e.g. :width="props.size") while still accepting :x1="22".
const NUM_ATTRS = new Set(['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height'])

// ---------------------------------------------------------------------------
// 1. parse icons-meta.ts for the canonical icon + variant list
// ---------------------------------------------------------------------------
function parseMeta() {
  const src = readFileSync(join(ROOT, 'src/icons-meta.ts'), 'utf8')
  const rowRe = /\{\s*kebab:\s*'([^']+)',\s*pascal:\s*'([^']+)',\s*animations:\s*\[([^\]]+)\]\s*\}/g
  const animRe = /\{\s*name:\s*'([^']+)',\s*source:\s*'([^']+)'\s*\}/g
  const rows = []
  let m
  while ((m = rowRe.exec(src))) {
    const variants = [...m[3].matchAll(animRe)].map(a => a[1])
    rows.push({ kebab: m[1], pascal: m[2], variants })
  }
  return rows
}

// ---------------------------------------------------------------------------
// 2. extract the `animations` object from an SFC (TS object literal -> data)
// ---------------------------------------------------------------------------
function parseAnimations(src) {
  const m = src.match(/const\s+animations\s*[:=][^{]*\{/)
  if (!m) return { __error: 'no animations block' }
  let i = src.indexOf('{', m.index)
  let depth = 0
  const start = i
  for (; i < src.length; i++) {
    const c = src[i]
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) { i++; break } }
  }
  let block = src.slice(start, i).replace(/satisfies\s+[\w.]+(<[^>]+>+)?/g, '')
  try {
    return new Function(`return (${block})`)()
  } catch (e) {
    return { __error: e.message }
  }
}

// ---------------------------------------------------------------------------
// 3. extract geometry: ordered list of <motion.*> template elements + the
//    group key on the root <motion.svg>
// ---------------------------------------------------------------------------
const SHAPE_TAGS = 'path|line|circle|rect|polyline|polygon|ellipse'

function parseGeometry(src) {
  // The group transform wraps the whole icon — it lives either on the root
  // <motion.svg> or on a <motion.g> wrapper. Take the first one bound to a
  // variant key (always `variants.group` by convention).
  let groupKey = null
  const gRe = /<motion\.(?:svg|g)\b([^>]*?)>/g
  let gm
  while ((gm = gRe.exec(src))) {
    const k = gm[1].match(/:variants="variants\.(\w+)"/)
    if (k) { groupKey = k[1]; break }
  }

  // Capture every drawable element in document order — BOTH animated
  // (<motion.path :variants=…>) AND static (<path>) ones. Static elements
  // carry no `:variants`, so they render as plain geometry with no animation;
  // dropping them (the old motion-only scan) left icons missing parts. The
  // v-if branch only contains the Pascal component, so a global scan is safe.
  const elRe = new RegExp(`<(?:motion\\.)?(${SHAPE_TAGS})\\b([^>]*?)\\/?>`, 'g')
  const elements = []
  let m
  while ((m = elRe.exec(src))) {
    const tag = m[1]
    const attrs = m[2]
    const key = attrs.match(/:variants="variants\.(\w+)"/)?.[1] ?? null
    const geom = {}
    for (const a of GEOM_ATTRS) {
      // accept both static (d="…") and bound-literal (:x1="22") geometry; the
      // [\s:] guard avoids matching `width` inside `stroke-width`, and the
      // numeric check drops prop bindings like :width="props.size".
      const am = attrs.match(new RegExp(`[\\s:]${a}="([^"]*)"`))
      if (!am) continue
      const val = am[1]
      if (NUM_ATTRS.has(a) && !/^-?[\d.]+$/.test(val.trim())) continue
      // reject bound expressions (e.g. :d="path.d" from a v-for): a real path
      // starts with a moveto, real points are coordinate lists.
      if (a === 'd' && !/^[Mm]/.test(val.trim())) continue
      if (a === 'points' && !/^[\d.\s,-]+$/.test(val.trim())) continue
      geom[a] = val
    }
    // An element may pin its transform reference box (`:style="{ transformBox:
    // 'view-box' }"`), which is what makes a px `transformOrigin` resolve
    // against the 24x24 viewBox instead of the element's own bbox. Mirror it
    // here, or the export pivots somewhere the component doesn't.
    const box = attrs.match(/transformBox:\s*'(view-box|fill-box)'/)?.[1] ?? null
    elements.push({ tag, key, geom, box })
  }
  return { elements, groupKey }
}

// ---------------------------------------------------------------------------
// 4. translation
// ---------------------------------------------------------------------------
const isInfinity = (v) => v === Infinity || v === Number.POSITIVE_INFINITY
const easeToCss = (e) => Array.isArray(e) ? `cubic-bezier(${e.join(', ')})`
  : ({ easeInOut: 'ease-in-out', easeIn: 'ease-in', easeOut: 'ease-out', linear: 'linear', circIn: 'ease-in', circOut: 'ease-out' }[e] || 'ease')
const lenPx = (v) => v === undefined ? '0' : (typeof v === 'number' ? `${v}px` : `${v}`)
const slug = (s) => s.replace(/[^a-zA-Z0-9]+/g, '-')

function composeTransform(v) {
  const parts = []
  const tx = v.translateX ?? v.x, ty = v.translateY ?? v.y
  if (tx !== undefined || ty !== undefined) parts.push(`translate(${lenPx(tx)}, ${lenPx(ty)})`)
  if (v.scale !== undefined) parts.push(`scale(${v.scale})`)
  else if (v.scaleX !== undefined || v.scaleY !== undefined) parts.push(`scale(${v.scaleX ?? 1}, ${v.scaleY ?? 1})`)
  if (v.rotate !== undefined) parts.push(`rotate(${v.rotate}deg)`)
  return parts.length ? parts.join(' ') : 'none'
}

function originOf(kf) {
  // static transform-origin from whichever block defines it (animate wins)
  const src = { ...(kf.initial || {}), ...(kf.animate || {}) }
  if (typeof src.transformOrigin === 'string') return src.transformOrigin
  const num = (x) => typeof x === 'number' ? `${(x * 100).toFixed(2).replace(/\.?0+$/, '')}%` : null
  const ox = num(src.originX), oy = num(src.originY)
  if (ox || oy) return `${ox ?? '50%'} ${oy ?? '50%'}`
  return null
}

// translate one element's variant ({initial, animate}) -> css fragment
function translateKeyframe(name, kf) {
  const init = kf.initial || {}
  const animate = kf.animate || {}
  const t = animate.transition || {}
  const props = Object.keys(animate).filter(k => k !== 'transition')
  if (!props.length) return null

  const stopCount = Math.max(2, ...props.map(p => Array.isArray(animate[p]) ? animate[p].length : 0))
  const times = t.times && t.times.length === stopCount ? t.times : Array.from({ length: stopCount }, (_, i) => i / (stopCount - 1))
  const valAt = (p, i) => {
    const a = animate[p]
    if (Array.isArray(a)) return a[Math.min(i, a.length - 1)]
    return i === 0 ? (init[p] ?? a) : a
  }

  const hasTransform = props.some(p => TRANSFORM_PROPS.has(p))
  const hasDraw = props.includes('pathLength')
  // opacity with a near-instant per-prop override => snap, don't tween
  const opacityFast = props.includes('opacity') && t.opacity && t.opacity.duration <= 0.05 && valAt('opacity', 0) === 0

  const stops = []
  if (opacityFast) { stops.push('  0% { opacity: 0 }'); stops.push('  2% { opacity: 1 }') }
  for (let i = 0; i < stopCount; i++) {
    const decl = []
    if (hasTransform) {
      const tv = {}
      for (const p of props) if (TRANSFORM_PROPS.has(p)) tv[p] = valAt(p, i)
      decl.push(`transform: ${composeTransform(tv)}`)
    }
    if (props.includes('opacity') && !opacityFast) decl.push(`opacity: ${valAt('opacity', i)}`)
    if (props.includes('fill')) decl.push(`fill: ${valAt('fill', i)}`)
    if (props.includes('fillOpacity')) decl.push(`fill-opacity: ${valAt('fillOpacity', i)}`)
    if (props.includes('strokeWidth')) decl.push(`stroke-width: ${valAt('strokeWidth', i)}`)
    if (hasDraw) {
      const pl = valAt('pathLength', i)
      const po = props.includes('pathOffset') ? valAt('pathOffset', i) : 0
      decl.push(`stroke-dasharray: ${pl} 1`, `stroke-dashoffset: ${po}`)
    }
    if (decl.length) stops.push(`  ${(times[i] * 100).toFixed(2).replace(/\.?0+$/, '')}% { ${decl.join('; ')} }`)
  }

  // resting state (from initial)
  const rest = []
  const restTv = {}
  for (const p of Object.keys(init)) if (TRANSFORM_PROPS.has(p)) restTv[p] = init[p]
  if (Object.keys(restTv).length) rest.push(`transform: ${composeTransform(restTv)}`)
  if (init.opacity !== undefined) rest.push(`opacity: ${init.opacity}`)
  if (init.fill !== undefined) rest.push(`fill: ${init.fill}`)
  if (init.pathLength !== undefined) rest.push(`stroke-dasharray: ${init.pathLength} 1`, `stroke-dashoffset: ${init.pathOffset ?? 0}`)
  const origin = originOf(kf)
  const needsBox = hasTransform && (props.includes('scale') || props.includes('scaleX') || props.includes('scaleY') || props.includes('rotate') || origin)

  // repeat / repeatType / ease can be top-level or per-prop (props share one
  // timeline in our single-@keyframes model, so take whichever defines them).
  const sources = [t, ...Object.values(t).filter(v => v && typeof v === 'object')]
  const pick = (k) => { for (const s of sources) if (s[k] !== undefined) return s[k]; return undefined }
  const repeat = pick('repeat')
  const repeatType = pick('repeatType')
  const loop = isInfinity(repeat)
  // motion repeat:N plays N+1 times; reverse/mirror yo-yos back to `initial`
  // (so the element ends visible, not stuck in its faded-out animate state).
  const iterations = loop ? 'infinite' : (typeof repeat === 'number' && repeat > 0 ? repeat + 1 : 1)
  const direction = (repeatType === 'reverse' || repeatType === 'mirror') ? 'alternate' : 'normal'

  // no top-level duration: motion uses the longest per-prop override, else its
  // 0.3s tween default. Matching this keeps the export from finishing early.
  let dur = t.duration
  if (dur == null) {
    const perDur = Object.values(t).filter(v => v && typeof v === 'object' && typeof v.duration === 'number').map(v => v.duration)
    dur = perDur.length ? Math.max(...perDur) : 0.3
  }
  const delay = t.delay ?? 0
  const sDur = +(dur * SPEED_SCALE).toFixed(3)
  const sDelay = +(delay * SPEED_SCALE).toFixed(3)
  const anim = `${name} ${sDur}s ${easeToCss(pick('ease'))} ${sDelay}s ${iterations} ${direction} both`
  return {
    keyframes: `@keyframes ${name} {\n${stops.join('\n')}\n}`,
    rest, anim, loop, needsBox, origin, hasDraw,
  }
}

// gather every animated prop across a variant's element + group keyframes
function variantProps(animations, variantName, keys) {
  const group = animations[variantName] || {}
  const props = new Set()
  let spring = false
  let implicitSpring = false
  const visit = (kf) => {
    if (!kf || typeof kf !== 'object') return
    for (const block of [kf.initial, kf.animate]) {
      if (!block || typeof block !== 'object') continue
      for (const [k, v] of Object.entries(block)) {
        if (k === 'transition') { if (v && v.type === 'spring') spring = true; continue }
        props.add(k)
      }
    }
    // motion's default animation for a *scalar* transform with no explicit
    // tween timing is a spring — which CSS can't reproduce (and which a plain
    // tween renders too fast / without the settle). Flag those so the variant
    // falls back to "needs the component" instead of shipping an off export.
    const animate = kf.animate
    if (animate && typeof animate === 'object') {
      const tr = animate.transition || {}
      const explicitTween = tr.duration != null || tr.ease != null || tr.type === 'tween' || tr.type === 'keyframes'
      for (const [k, v] of Object.entries(animate)) {
        if (k === 'transition' || !TRANSFORM_PROPS.has(k)) continue
        const per = tr[k]
        const perExplicit = per && typeof per === 'object' && (per.duration != null || per.ease != null || per.type != null)
        if (per && per.type === 'spring') spring = true
        if (!Array.isArray(v) && !explicitTween && !perExplicit) implicitSpring = true
      }
    }
  }
  for (const key of [...keys, 'group']) visit(group[key])
  return { props: [...props], spring, implicitSpring }
}

function buildSnippet({ kebab, variant, elements, groupKey, animations }) {
  const prefix = `lmi-${kebab}${variant === 'default' ? '' : `--${slug(variant)}`}`
  const va = animations[variant] || {}
  const usedKeys = [...new Set(elements.map(e => e.key).filter(Boolean))]

  const cssBlocks = []
  const elementBoxNeeds = {} // key -> {needsBox, origin}
  const elementHasDraw = {}

  for (const key of usedKeys) {
    const tr = translateKeyframe(`${prefix}-${key}`, va[key] || {})
    if (!tr) continue
    cssBlocks.push(tr.keyframes)
    const cls = `${prefix}-${key}`
    const base = []
    if (tr.needsBox) {
      const box = elements.find(e => e.key === key && e.box)?.box ?? 'fill-box'
      base.push(`transform-box: ${box}`, `transform-origin: ${tr.origin || 'center'}`)
    }
    if (tr.rest.length) base.push(...tr.rest)
    if (base.length) cssBlocks.push(`.${cls} { ${base.join('; ')}; }`)
    const sel = tr.loop ? `.${cls}` : `.${prefix}:hover .${cls}`
    cssBlocks.push(`${sel} { animation: ${tr.anim}; }`)
    elementHasDraw[key] = tr.hasDraw
  }

  // group (whole-icon) transform -> rotate/translate a <g> about the view box
  let groupTr = null
  if (groupKey && va[groupKey]) {
    groupTr = translateKeyframe(`${prefix}-group`, va[groupKey])
    if (groupTr) {
      cssBlocks.push(groupTr.keyframes)
      const base = ['transform-box: view-box', `transform-origin: ${groupTr.origin || 'center'}`]
      if (groupTr.rest.length) base.push(...groupTr.rest)
      cssBlocks.push(`.${prefix}-g { ${base.join('; ')}; }`)
      const sel = groupTr.loop ? `.${prefix}-g` : `.${prefix}:hover .${prefix}-g`
      cssBlocks.push(`${sel} { animation: ${groupTr.anim}; }`)
    }
  }

  if (!cssBlocks.length) return null // nothing animates -> not worth an export

  // Bail if any element's required geometry is missing — e.g. a <path> whose
  // `d` is bound to a v-for variable. Those can't be statically exported, so
  // the icon falls back to "needs the component" rather than shipping broken.
  const REQUIRED = { path: 'd', polyline: 'points', polygon: 'points' }
  for (const e of elements) {
    const req = REQUIRED[e.tag]
    if (req && e.geom[req] === undefined) return null
  }

  // build the SVG markup
  const elMarkup = elements.map(e => {
    const cls = e.key && usedKeys.includes(e.key) && va[e.key] ? `${prefix}-${e.key}` : ''
    const needsPL = e.key && elementHasDraw[e.key]
    const attrs = GEOM_ATTRS.filter(a => e.geom[a] !== undefined).map(a => `${a}="${e.geom[a]}"`).join(' ')
    return `    <${e.tag}${cls ? ` class="${cls}"` : ''} ${attrs}${needsPL ? ' pathLength="1"' : ''} />`
  }).join('\n')
  const inner = groupTr ? `  <g class="${prefix}-g">\n${elMarkup}\n  </g>` : elMarkup

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="${prefix}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${inner}
</svg>`
  const style = `<style>\n${cssBlocks.join('\n')}\n</style>`
  const header = `<!-- ${kebab}${variant === 'default' ? '' : ` · ${variant}`} — no-JS CSS export · @respeak/lucide-motion-vue -->`
  return `${header}\n${svg}\n${style}`
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const meta = parseMeta()
const status = {} // kebab -> variant -> status
const codes = {}  // "kebab|variant" -> snippet
const counts = { ok: 0, excluded: 0, spring: 0, 'd-morph': 0, multivariant: 0, unsupported: 0, parse: 0 }
const unsupportedProps = {}

for (const { kebab, variants } of meta) {
  status[kebab] = {}
  const src = readFileSync(join(ICONS_DIR, `${kebab}.vue`), 'utf8')
  const multi = src.includes('MultiVariantIcon')

  function setStatus(variant, st) { status[kebab][variant] = st; counts[st]++ }

  if (multi) { for (const v of variants) setStatus(v, 'multivariant'); continue }
  const anims = parseAnimations(src)
  if (anims.__error) { for (const v of variants) setStatus(v, 'parse'); continue }
  const { elements, groupKey } = parseGeometry(src)
  const keys = [...new Set(elements.map(e => e.key).filter(Boolean))]

  for (const variant of variants) {
    const excluded = EXCLUDE.has(kebab) || EXCLUDE.has(`${kebab}:${variant}`)
    const { props, spring, implicitSpring } = variantProps(anims, variant, keys)
    if (props.includes('d')) { setStatus(variant, 'd-morph'); continue }
    if (spring || implicitSpring) { setStatus(variant, 'spring'); continue }
    const bad = props.filter(p => !PORTABLE.has(p))
    if (bad.length) { for (const p of bad) unsupportedProps[p] = (unsupportedProps[p] || 0) + 1; setStatus(variant, 'unsupported'); continue }

    const snippet = buildSnippet({ kebab, variant, elements, groupKey, animations: anims })
    if (!snippet) { setStatus(variant, 'unsupported'); continue }
    codes[`${kebab}|${variant}`] = snippet
    setStatus(variant, excluded ? 'excluded' : 'ok')
  }
}

// ---- write index ts ----
const indexTs = `// GENERATED by scripts/build-css-exports.mjs — do not edit by hand.
// Per-(icon, variant) status for the no-JS "Copy as code" feature. Only 'ok'
// variants get a CSS export; everything else needs the component.
export type CssExportStatus =
  | 'ok'            // faithful CSS export available
  | 'excluded'      // mechanically exportable but culled after review
  | 'spring'        // spring physics — not expressible in CSS
  | 'd-morph'       // path-shape morph — not expressible in CSS
  | 'multivariant'  // divergent element graphs — needs the component
  | 'unsupported'   // animates a property we don't map to CSS
  | 'parse'         // dynamic/shared-const animation — needs the component

export const cssExportStatus: Record<string, Record<string, CssExportStatus>> = ${JSON.stringify(status, null, 0)}

export function getCssExportStatus(kebab: string, variant: string): CssExportStatus | undefined {
  return cssExportStatus[kebab]?.[variant]
}
export function isCssPortable(kebab: string, variant: string): boolean {
  return cssExportStatus[kebab]?.[variant] === 'ok'
}
`
mkdirSync(join(ROOT, 'docs/generated'), { recursive: true })
writeFileSync(join(ROOT, 'docs/generated/css-export-index.ts'), indexTs)
mkdirSync(join(ROOT, 'docs/public'), { recursive: true })
writeFileSync(join(ROOT, 'docs/public/css-exports.json'), JSON.stringify(codes))

// ---- report ----
const totalVariants = Object.values(status).reduce((n, vs) => n + Object.keys(vs).length, 0)
console.log('variants total:', totalVariants)
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(13)} ${v}`)
console.log('exported (ok):', Object.keys(codes).length)
if (Object.keys(unsupportedProps).length) console.log('unsupported props seen:', unsupportedProps)
