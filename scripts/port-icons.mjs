#!/usr/bin/env node
/**
 * Port every animate-ui icon .tsx from the upstream repo to a Vue SFC in src/icons/.
 * Regenerate src/index.ts with Name + NameAnimated re-exports.
 *
 * Strategy:
 *  - git clone --depth=1 the upstream repo into /tmp once (reuse on re-runs).
 *  - For each icon:
 *      1. Extract module-level `const foo: Variants = {...}` bindings (cloud-rain etc).
 *      2. Extract the `const animations = {...}` block via brace-balanced scan.
 *      3. Extract the `IconComponent` function's `return (...)` JSX.
 *      4. Run ordered regex transforms on the JSX to emit a Vue template.
 *      5. Write src/icons/<kebab>.vue using the established SFC shape.
 *  - Skip any icon whose source doesn't match the expected template and log why.
 *
 * Run:  node scripts/port-icons.mjs [--limit=N] [--force]
 *
 *   --limit=N   Only port the first N icons alphabetically (for smoke tests).
 *   --force     Overwrite even if the output file already exists.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'src/icons')
const INDEX_FILE = join(ROOT, 'src/index.ts')
const UPSTREAM_DIR = '/tmp/animate-ui-upstream'

const args = process.argv.slice(2)
const limit = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity
const force = args.includes('--force')

function sh(cmd) { execSync(cmd, { stdio: 'inherit' }) }

function ensureUpstream() {
  if (existsSync(UPSTREAM_DIR)) {
    try { sh(`git -C ${UPSTREAM_DIR} fetch --depth=1 origin main && git -C ${UPSTREAM_DIR} reset --hard origin/main`) }
    catch { rmSync(UPSTREAM_DIR, { recursive: true, force: true }); sh(`git clone --depth=1 https://github.com/imskyleen/animate-ui.git ${UPSTREAM_DIR}`) }
  } else {
    sh(`git clone --depth=1 https://github.com/imskyleen/animate-ui.git ${UPSTREAM_DIR}`)
  }
}

const kebabToPascal = k => k.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')

/**
 * Scan `src` starting at `startIdx` (which must point at an opener) and return
 * the substring covering the balanced pair (inclusive), handling strings and
 * comments so we don't miscount braces inside them.
 */
function extractBalanced(src, startIdx, open = '{', close = '}') {
  let depth = 0, inStr = null, inLC = false, inBC = false
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i], n = src[i + 1]
    if (inLC) { if (c === '\n') inLC = false; continue }
    if (inBC) { if (src[i - 1] === '*' && c === '/') inBC = false; continue }
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '/' && n === '/') { inLC = true; continue }
    if (c === '/' && n === '*') { inBC = true; continue }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return { block: src.slice(startIdx, i + 1), end: i + 1 }
    }
  }
  throw new Error('Unbalanced')
}

/**
 * Capture everything between the icon-helpers import and `const animations`.
 * Includes module-level constants like `SEGMENT_COUNT`, bindings like
 * `const rainAnimation: Variants = {...}`, helpers like
 * `const spring = {...} as const`, etc. We emit the captured region verbatim
 * into the Vue SFC's <script setup> block so those identifiers resolve.
 *
 * Skipped:
 *  - the `'use client';` directive (React-only)
 *  - imports (we write fresh ones)
 *  - `type XxxProps = IconProps<...>` (we don't port the React type shape)
 */
function extractModulePrelude(src) {
  const importsEnd = src.match(/from\s+['"]@\/registry\/icons\/icon['"];?/)
  if (!importsEnd) return ''
  let start = importsEnd.index + importsEnd[0].length

  // Skip `type XxxProps = IconProps<...>;`
  const typeDecl = src.slice(start).match(/\s*type\s+\w+Props\s*=\s*IconProps[^;]+;/)
  if (typeDecl) start += typeDecl.index + typeDecl[0].length

  const anim = src.slice(start).match(/const\s+animations\s*=/)
  if (!anim) return ''
  return src.slice(start, start + anim.index).trim()
}

function extractAnimations(src) {
  const m = src.match(/const\s+animations\s*=\s*\{/)
  if (!m) throw new Error('no `const animations = {` block')
  const braceIdx = m.index + m[0].length - 1
  const { block } = extractBalanced(src, braceIdx)
  return block
}

/**
 * Given the animations block (as source text), return the list of top-level
 * animation names — `default`, `default-loop`, `fill`, `rotate`, `find`, etc.
 * Walks depth-aware so nested keys inside a Variant don't get captured.
 */
function extractAnimationKeys(animsBlock) {
  const keys = []
  let depth = 0, inStr = null, i = 0
  while (i < animsBlock.length) {
    const c = animsBlock[i]
    if (inStr) {
      if (c === '\\') { i += 2; continue }
      if (c === inStr) inStr = null
      i++; continue
    }
    if (c === '"' || c === "'") { inStr = c; i++; continue }
    if (c === '{') { depth++; i++; continue }
    if (c === '}') { depth--; i++; continue }
    if (depth === 1) {
      const m = animsBlock.slice(i).match(
        /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:\s*(\{|\(|\w)/,
      )
      if (m) {
        keys.push(m[1] || m[2] || m[3])
        // Advance up to but NOT past the value-opening char so the `{`/depth
        // logic gets to see it on the next iteration; otherwise depth never
        // actually enters the nested Variant and we'd capture nested keys too.
        i += m[0].length - 1
        continue
      }
    }
    i++
  }
  return keys
}

function extractReturnJSX(src) {
  // IconComponent's return (...) expression.
  const fn = src.match(/function\s+IconComponent[^]*?return\s*\(/)
  if (!fn) throw new Error('no IconComponent return')
  const parenIdx = fn.index + fn[0].length - 1
  const { block } = extractBalanced(src, parenIdx, '(', ')')
  return block.slice(1, -1).trim()
}

/** Convert the IconComponent's JSX subtree into a Vue template fragment. */
function jsxToVueTemplate(jsx) {
  let out = jsx

  // Drop {...props} spread — we don't forward arbitrary props in the port.
  out = out.replace(/\s+\{\.\.\.props\}/g, '')

  // JSX comments {/* ... */} → HTML comments so the SFC parser is happy.
  out = out.replace(/\{\s*\/\*([\s\S]*?)\*\/\s*\}/g, '<!--$1-->')

  // style={{ foo: 'bar' }} → :style="{ foo: 'bar' }". The inner object is the
  // same JS in both worlds; we only rewrite the attribute wrapper.
  out = out.replace(/style=\{(\{[^}]*\})\}/g, ':style="$1"')

  // motion/react rewrites pixel `transformOrigin` into percentages so it
  // matches its auto-injected `transform-box: fill-box`. motion-v passes the
  // pixel value through literally, which makes `12px 12px` resolve against
  // the element's bbox top-left instead of the SVG viewport — shifting the
  // rotation/scale pivot. Pin transform-box to view-box so pixel origins are
  // interpreted in SVG user coordinates, matching the upstream intent.
  // Only applied when transformOrigin is a pixel value and transformBox is
  // not already set (percentages and keywords continue to use fill-box).
  out = out.replace(/:style="(\{[^"}]*\})"/g, (match, obj) => {
    if (!/transformOrigin:\s*'[^']*px[^']*'/.test(obj)) return match
    if (/transformBox\s*:/.test(obj)) return match
    const patched = obj.replace(/\s*\}$/, ", transformBox: 'view-box' }")
    return `:style="${patched}"`
  })

  // className={cn(..., className)} — the upstream uses a `cn` helper + a
  // forwarded `className` prop that we don't wire in the port. Strip the
  // whole attribute; consumers can pass classes via normal attrs fallthrough.
  out = out.replace(/\s+className=\{[^}]*\}/g, '')

  // First `animate={controls}` occurrence also wires @animationComplete for loop support.
  let first = true
  out = out.replace(/animate=\{controls\}/g, () => {
    if (first) {
      first = false
      return `:animate="current"\n      @animationComplete="notifyComplete"`
    }
    return `:animate="current"`
  })

  // initial="initial" → stays as a plain string attr; Vue accepts it.

  // variants={variants.X} → :variants="variants.X"
  out = out.replace(/variants=\{variants\.(\w+)\}/g, ':variants="variants.$1"')
  // variants={someModuleLevelVar}
  out = out.replace(/variants=\{(\w+)\}/g, ':variants="$1"')

  // Size: width={size} / height={size}
  out = out.replace(/width=\{size\}/g, ':width="props.size"')
  out = out.replace(/height=\{size\}/g, ':height="props.size"')

  // React camelCase SVG attrs → kebab. Do this BEFORE expression conversion so
  // `strokeWidth={2}` becomes `stroke-width={2}` before the generic `{N}` pass.
  out = out
    .replace(/\bstrokeWidth=/g, 'stroke-width=')
    .replace(/\bstrokeLinecap=/g, 'stroke-linecap=')
    .replace(/\bstrokeLinejoin=/g, 'stroke-linejoin=')
    .replace(/\bstrokeDasharray=/g, 'stroke-dasharray=')
    .replace(/\bstrokeDashoffset=/g, 'stroke-dashoffset=')
    .replace(/\bclipPath=/g, 'clip-path=')
    .replace(/\bclipRule=/g, 'clip-rule=')
    .replace(/\bfillRule=/g, 'fill-rule=')

  // Hard-coded stroke-width → bind to props so consumer can override.
  out = out.replace(/stroke-width=\{\d+(?:\.\d+)?\}/g, ':stroke-width="props.strokeWidth"')

  // Generic attr={<number or simple negative number>} → :attr="<value>".
  // Done after kebab conversion so `stroke-width={2}` doesn't match; it was
  // already rewritten to use props.strokeWidth above.
  out = out.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)=\{(-?\d+(?:\.\d+)?)\}/g, '$1:$2="$3"')

  // String attrs with spaces (d="m 1 2 3 ...") stay as is.

  return out
}

function emitVueSfc({ pascal, needsPathClassName }, prelude, animationsBlock, jsx) {
  const preludeSection = prelude ? `${prelude}\n\n` : ''

  // Add `v-else` marker on the top-level motion.svg tag of the JSX, and
  // inject `overflow="visible"` so keyframe values that temporarily push
  // children outside the 24×24 viewBox don't get clipped by the
  // user-agent's default `svg { overflow: hidden }` rule.
  const jsxWithVElse = jsx.replace(
    /^<motion\.svg\b/,
    '<motion.svg\n    v-else\n    overflow="visible"',
  )

  // Some upstream icons (e.g. fingerprint) apply `pathClassName` on the svg —
  // a CSS rule that overrides motion's fully-drawn `stroke-dasharray: 1px 1px`
  // internal state to a solid `1px 0px`. Without it, pathLength animations
  // render visible 1px dashes at large sizes. Our codemod strips `className`
  // attrs wholesale, so we re-inject the rule as a <style> block when needed.
  const styleBlock = needsPathClassName
    ? `\n<style>\n[stroke-dasharray="1px 1px"] {\n  stroke-dasharray: 1px 0px !important;\n}\n</style>\n`
    : ''

  return `<script setup lang="ts">
// Auto-generated from animate-ui upstream by scripts/port-icons.mjs.
// Variants and SVG geometry adapted from animate-ui (MIT + Commons Clause).
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'
import {
  getVariants,
  hasOwnTriggers,
  useAnimateIconContext,
  type IconTriggerProps,
} from '../core/context'

const props = withDefaults(
  defineProps<IconTriggerProps & { strokeWidth?: number }>(),
  { size: 28, strokeWidth: 2 },
)

${preludeSection}const animations = ${animationsBlock} satisfies Record<string, Record<string, Variants>>

const variants = getVariants(animations)
const { current, notifyComplete } = useAnimateIconContext()
const selfWrap = computed(() => hasOwnTriggers(props))
</script>

<template>
  <AnimateIcon
    v-if="selfWrap"
    :animate="props.animate"
    :animateOnHover="props.animateOnHover"
    :animateOnTap="props.animateOnTap"
    :animateOnView="props.animateOnView"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <${pascal} :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  ${jsxWithVElse}
</template>
${styleBlock}`
}

function portOne(kebab) {
  const pascal = kebabToPascal(kebab)
  const srcPath = join(UPSTREAM_DIR, 'apps/www/registry/icons', kebab, 'index.tsx')
  if (!existsSync(srcPath)) throw new Error('no upstream file')
  const src = readFileSync(srcPath, 'utf8')

  const prelude = extractModulePrelude(src)
  const animations = extractAnimations(src)
  // Dedupe: link-2's upstream animations object uses repeated top-level keys
  // (last wins at runtime in JS), but our brace-walker naively collects each
  // occurrence. The icon works fine — Object.keys dedupes automatically — but
  // the public `iconsMeta` list shouldn't expose phantom duplicates. Preserve
  // first-occurrence order.
  const animationKeys = [...new Set(extractAnimationKeys(animations))]
  const jsx = extractReturnJSX(src)
  const vueJsx = jsxToVueTemplate(jsx)
  const needsPathClassName = /\bpathClassName\b/.test(src)
  const sfc = emitVueSfc({ pascal, needsPathClassName }, prelude, animations, vueJsx)

  const outPath = join(OUT_DIR, `${kebab}.vue`)
  if (existsSync(outPath) && !force) return { kebab, pascal, status: 'skipped-exists', animationKeys }
  writeFileSync(outPath, sfc)
  return { kebab, pascal, status: 'written', animationKeys }
}

function regenerateIndex() {
  const files = readdirSync(OUT_DIR).filter(f => f.endsWith('.vue')).sort()
  const body = files
    .map(f => {
      const kebab = f.replace(/\.vue$/, '')
      const pascal = kebabToPascal(kebab)
      return `export { default as ${pascal}, default as ${pascal}Animated } from './icons/${kebab}.vue'`
    })
    .join('\n')

  const content = `/**
 * Main barrel. Re-exports core primitives + every icon under two names:
 *   - short:    Heart, BetweenVerticalStart
 *   - suffixed: HeartAnimated, BetweenVerticalStartAnimated
 *
 * Tree-shaking works because the package is ESM + "sideEffects": false.
 * Subpath imports (\`@respeak/lucide-motion-vue/icons/heart\`) still work
 * for anyone who wants guaranteed separate chunks.
 *
 * GENERATED by scripts/port-icons.mjs — do not edit by hand below this block.
 */
export * from './core'
export { iconsMeta, type IconMeta } from './icons-meta'

// icons (auto-generated)
${body}
`
  writeFileSync(INDEX_FILE, content)
}

/**
 * Parse the current icons-meta.ts and return rows whose variants include any
 * non-`animate-ui` source — hand-written icons (e.g. rocket) and cross-source
 * variants (e.g. lucide-animated additions). These must survive a port rerun,
 * since the upstream animate-ui repo doesn't know about them.
 */
function readNonUpstreamRows() {
  const metaPath = join(ROOT, 'src/icons-meta.ts')
  if (!existsSync(metaPath)) return new Map()
  const src = readFileSync(metaPath, 'utf8')
  const rowRe = /\{\s*kebab:\s*'([^']+)',\s*pascal:\s*'([^']+)',\s*animations:\s*\[([^\]]+)\]\s*\},/g
  const animRe = /\{\s*name:\s*'([^']+)',\s*source:\s*'([^']+)'\s*\}/g
  const rows = new Map()
  for (const m of src.matchAll(rowRe)) {
    const [, kebab, pascal, animsStr] = m
    const anims = [...animsStr.matchAll(animRe)].map(a => ({ name: a[1], source: a[2] }))
    if (anims.some(a => a.source !== 'animate-ui')) rows.set(kebab, { kebab, pascal, anims })
  }
  return rows
}

function regenerateMeta(results) {
  // Auto-ported upstream rows + preserved non-upstream rows. When a kebab
  // exists in both (an animate-ui icon that later gained a lucide-animated
  // variant), the preserved row wins — it carries the merged variant list
  // maintained by hand.
  const preserved = readNonUpstreamRows()
  const autoRows = results
    .filter(r => r.animationKeys && !preserved.has(r.kebab))
    .map(r => ({
      kebab: r.kebab,
      pascal: r.pascal,
      anims: r.animationKeys.map(name => ({ name, source: 'animate-ui' })),
    }))
  const entries = [...autoRows, ...preserved.values()]
    .sort((a, b) => a.kebab.localeCompare(b.kebab))
    .map(r => {
      const anims = r.anims
        .map(a => `{ name: '${a.name}', source: '${a.source}' }`)
        .join(', ')
      return `  { kebab: '${r.kebab}', pascal: '${r.pascal}', animations: [${anims}] },`
    })
    .join('\n')

  const content = `/**
 * Metadata for every ported icon: kebab + Pascal names + the list of
 * animation variants with their source attribution.
 *
 * Each variant carries its \`source\` so the docs drawer can credit the right
 * project when a user flips between variants — see ATTRIBUTIONS.md for the
 * full list of upstream sources and licenses.
 *
 * GENERATED by scripts/port-icons.mjs — do not edit by hand except when
 * adding hand-written icons or cross-source variants (lucide-animated
 * additions to existing animate-ui icons).
 */
export type IconSource = 'animate-ui' | 'lucide-animated' | 'hand-written'

export interface IconAnimation {
  /** Variant name you pass to the \`animation\` prop, e.g. 'default' or 'fill' */
  name: string
  /** Upstream project this specific variant's variants/geometry came from */
  source: IconSource
}

export interface IconMeta {
  /** kebab-case file name, e.g. 'between-vertical-start' */
  kebab: string
  /** PascalCase component name, e.g. 'BetweenVerticalStart' */
  pascal: string
  /** Available animation variants (use \`name\` with the \`animation\` prop) */
  animations: IconAnimation[]
}

export const iconsMeta: IconMeta[] = [
${entries}
]
`
  writeFileSync(join(ROOT, 'src/icons-meta.ts'), content)
}

// --- main ---
mkdirSync(OUT_DIR, { recursive: true })
ensureUpstream()

const dirs = readdirSync(join(UPSTREAM_DIR, 'apps/www/registry/icons'), { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'icon')
  .map(e => e.name)
  .sort()
  .slice(0, limit)

const results = { written: 0, 'skipped-exists': 0, failed: [] }
const perIcon = []
for (const kebab of dirs) {
  try {
    const r = portOne(kebab)
    results[r.status] = (results[r.status] || 0) + 1
    perIcon.push(r)
  } catch (e) {
    results.failed.push({ kebab, reason: e.message })
  }
}

regenerateIndex()
regenerateMeta(perIcon)

console.log(`
Ported ${dirs.length} icons:
  written:        ${results.written}
  skipped-exists: ${results['skipped-exists']}
  failed:         ${results.failed.length}
`)
if (results.failed.length) {
  console.log('Failures:')
  for (const f of results.failed) console.log(`  - ${f.kebab}: ${f.reason}`)
}
