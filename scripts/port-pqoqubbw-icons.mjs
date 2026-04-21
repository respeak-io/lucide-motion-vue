#!/usr/bin/env node
/**
 * Port icons from pqoqubbw/icons (showcased as "lucide-animated") to Vue SFCs.
 *
 * Strategy mirrors scripts/port-icons.mjs but targets a different source
 * project with a different React shape (forwardRef + useAnimation + mouse
 * handlers instead of animate-ui's `const animations = {...}` blocks).
 *
 *  1. Clone pqoqubbw/icons into /tmp.
 *  2. For each icons/*.tsx:
 *     a. Extract every module-level `const NAME_VARIANTS: Variants = {...}`.
 *     b. Extract the svg JSX tree inside the forwardRef component's return.
 *     c. Walk every `<motion.X>` element, pair it with its variants const.
 *     d. Rename `normal` → `initial` in variants + JSX `initial="normal"` refs.
 *     e. Convert React JSX → Vue template (kebab attrs, prop bindings, etc.).
 *     f. Emit a Vue SFC matching our AnimateIcon context shape.
 *  3. Skip (with log) any icon that:
 *     - Uses inline variants objects (e.g. waves).
 *     - Has variant keys outside {normal, animate} (sequenced icons like ban).
 *     - Fires multiple `controls.start()` calls in mouseEnter (sequenced).
 *     - Already exists at src/icons/<kebab>.vue (unless --force).
 *  4. Update src/icons-meta.ts — splice in lucide-animated rows, preserving
 *     animate-ui + hand-written rows.
 *  5. Update src/index.ts — regenerate exports from the filesystem.
 *
 * Run: node scripts/port-pqoqubbw-icons.mjs [--limit=N] [--force] [--only=a,b]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'src/icons')
const META_FILE = join(ROOT, 'src/icons-meta.ts')
const INDEX_FILE = join(ROOT, 'src/index.ts')
const UPSTREAM_DIR = '/tmp/pqoqubbw-upstream'
const UPSTREAM_REPO = 'https://github.com/pqoqubbw/icons.git'

const args = process.argv.slice(2)
const limit = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity
const only = (args.find(a => a.startsWith('--only=')) || '').split('=')[1]
const onlySet = only ? new Set(only.split(',').map(s => s.trim())) : null
const force = args.includes('--force')

function sh(cmd) { execSync(cmd, { stdio: 'inherit' }) }

function ensureUpstream() {
  if (existsSync(UPSTREAM_DIR)) {
    try { sh(`git -C ${UPSTREAM_DIR} fetch --depth=1 origin main && git -C ${UPSTREAM_DIR} reset --hard origin/main`) }
    catch { rmSync(UPSTREAM_DIR, { recursive: true, force: true }); sh(`git clone --depth=1 ${UPSTREAM_REPO} ${UPSTREAM_DIR}`) }
  } else {
    sh(`git clone --depth=1 ${UPSTREAM_REPO} ${UPSTREAM_DIR}`)
  }
}

const kebabToPascal = k => k.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')

/**
 * Scan `src` from `startIdx` (pointing at an opener) and return the substring
 * covering the balanced pair (inclusive). Handles strings, template literals,
 * and comments so we don't miscount braces inside them.
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
  throw new Error(`Unbalanced ${open}${close} starting at ${startIdx}`)
}

/**
 * Extract any module-level `const IDENTIFIER = {...};` (or array/value) that
 * is NOT a Variants declaration. Pqoqubbw commonly declares a shared
 * `const TRANSITION = {...}` and references it as `transition={TRANSITION}`
 * on every motion element; we need that binding available inside the SFC's
 * <script setup> block, otherwise the template fails to compile.
 *
 * Returns { name: string, decl: string } for each const we want to hoist.
 */
function extractAuxConsts(src) {
  const out = []
  // Two shapes:
  //   1. `const NAME[: Type] = {...};`   object consts (TRANSITION, etc.)
  //   2. `const NAME = <number|string>;` scalar consts (DURATION, EYEBROW_ROTATION)
  // Both are module-level and UPPER_SNAKE. We hoist both into the SFC so
  // any `attr={NAME}` or inline expression `delay: NAME` resolves.
  const objRe = /^const\s+([A-Z_][A-Z0-9_]*)(\s*:\s*[A-Za-z_][\w<>, ]*)?\s*=\s*\{/gm
  let m
  while ((m = objRe.exec(src)) !== null) {
    const name = m[1]
    const ann = m[2] || ''
    if (/:\s*Variants\s*=/.test(m[0])) continue
    const braceIdx = m.index + m[0].length - 1
    const { block, end } = extractBalanced(src, braceIdx)
    const tail = src.slice(end).match(/^\s*;/)
    // Keep the original TS annotation (e.g. `: Transition`) so literal-type
    // narrowing doesn't break strict motion-v types. We import Transition
    // alongside Variants in the SFC so the symbol resolves.
    out.push({ name, decl: `const ${name}${ann} = ${block}${tail ? ';' : ''}` })
  }
  // Scalar consts: `const FOO = 500;` or `const FOO = 'bar';`. Stop at `;`
  // or newline. We avoid matching values that span braces/parens.
  const scalarRe = /^const\s+([A-Z_][A-Z0-9_]*)\s*=\s*([-\d.]+|"[^"]*"|'[^']*')\s*;?/gm
  while ((m = scalarRe.exec(src)) !== null) {
    const [, name, value] = m
    // Skip if we already captured this name as an object const above.
    if (out.some(c => c.name === name)) continue
    out.push({ name, decl: `const ${name} = ${value};` })
  }
  return out
}

/**
 * Return a map of const name → { body: string, isDynamic: boolean }.
 * `body` is the brace-balanced `{...}` text of the variants object (not
 * including the outer braces). `isDynamic` flags variants that use the
 * `(custom: number) => ({...})` arrow-function shape for state values.
 */
function extractVariantConsts(src) {
  const consts = {}
  const re = /const\s+([A-Z_][A-Z0-9_]*)\s*:\s*Variants\s*=\s*\{/g
  let m
  while ((m = re.exec(src)) !== null) {
    const braceIdx = m.index + m[0].length - 1
    const { block } = extractBalanced(src, braceIdx)
    const body = block.slice(1, -1) // strip outer {}
    // Dynamic variants use `normal: (custom: number) => ({` or `: () => ({`
    const isDynamic = /:\s*\([^)]*\)\s*=>\s*\(/.test(body)
    consts[m[1]] = { body, isDynamic }
  }
  return consts
}

/**
 * Return the list of top-level state keys inside a variants-object body.
 * Depth-aware so nested object keys don't leak through.
 */
function variantStateKeys(body) {
  const keys = []
  let depth = 0, inStr = null, i = 0
  while (i < body.length) {
    const c = body[i]
    if (inStr) {
      if (c === '\\') { i += 2; continue }
      if (c === inStr) inStr = null
      i++; continue
    }
    if (c === '"' || c === "'") { inStr = c; i++; continue }
    if (c === '{' || c === '(') { depth++; i++; continue }
    if (c === '}' || c === ')') { depth--; i++; continue }
    if (depth === 0) {
      const m = body.slice(i).match(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:\s*(\{|\(|[A-Za-z0-9_])/)
      if (m) {
        keys.push(m[1] || m[2] || m[3])
        i += m[0].length - 1
        continue
      }
    }
    i++
  }
  return keys
}

/**
 * Rename the top-level `normal:` state to `initial:` in a variants body.
 * Depth-aware so we only rewrite the state-level key, not nested object keys
 * that happen to be called `normal`.
 */
function renameNormalToInitial(body) {
  let out = ''
  let depth = 0, inStr = null, i = 0
  while (i < body.length) {
    const c = body[i]
    if (inStr) {
      out += c
      if (c === '\\') { out += body[i + 1] ?? ''; i += 2; continue }
      if (c === inStr) inStr = null
      i++; continue
    }
    if (c === '"' || c === "'") { inStr = c; out += c; i++; continue }
    if (c === '{' || c === '(') { depth++; out += c; i++; continue }
    if (c === '}' || c === ')') { depth--; out += c; i++; continue }
    if (depth === 0) {
      const m = body.slice(i).match(/^(\s*)normal(\s*):/)
      if (m) {
        out += `${m[1]}initial${m[2]}:`
        i += m[0].length
        continue
      }
    }
    out += c
    i++
  }
  return out
}

/**
 * Find the `return ( <div> ... </div> );` subtree in a forwardRef component
 * and return just the inner JSX (between the outer <div> open and close tags).
 * Pqoqubbw wraps every icon in a div with mouse handlers; we strip it and
 * keep only the svg subtree.
 */
function extractSvgJsx(src) {
  // Locate the return expression of the component.
  const retIdx = src.search(/\breturn\s*\(/)
  if (retIdx < 0) throw new Error('no return (')
  const parenIdx = src.indexOf('(', retIdx)
  const { block } = extractBalanced(src, parenIdx, '(', ')')
  const body = block.slice(1, -1).trim()

  // Either <motion.svg ...> ... </motion.svg>  (svg-level variants)
  // Or     <div ...> <svg ...> ... </svg> </div>  (common case)
  const motionSvgMatch = body.match(/<motion\.svg\b[\s\S]*?<\/motion\.svg>/)
  if (motionSvgMatch) return { kind: 'motion-svg', jsx: motionSvgMatch[0] }
  const svgMatch = body.match(/<svg\b[\s\S]*?<\/svg>/)
  if (svgMatch) return { kind: 'svg', jsx: svgMatch[0] }
  throw new Error('no <svg> or <motion.svg> found in return')
}

/** VARIANT_NAME → camelCase part key. `CIRCLE_VARIANTS` → `circle`, etc. */
function partNameFromConst(name) {
  const base = name.replace(/_VARIANTS$/, '')
  return base.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Convert a pqoqubbw JSX svg subtree into a Vue template string.
 *
 * In Vue (and in motion-v) `motion.X` components accept kebab-cased attrs
 * and `:attr` for bound expressions. This pass mirrors the codemod in
 * scripts/port-icons.mjs but targets pqoqubbw's quirks:
 *   - size is `height={size}` (expression) → `:height="props.size"`
 *   - strokeWidth is `"2"` (string literal) → `:stroke-width="props.strokeWidth"`
 *   - variants={FOO_VARIANTS} → `:variants="variants.foo"`
 *   - initial="normal" → `initial="initial"`
 *   - animate={controls} → `:animate="current"` (+ @animationComplete on first)
 *   - style={{ foo: bar }} → `:style="{ foo: bar }"`
 *   - custom={0.2} → `:custom="0.2"`
 *   - {...props} stripped — we don't forward HTML div attrs
 */
function jsxToVueTemplate(jsx, variantRefs) {
  let out = jsx

  // className={cn(...)}  → strip
  out = out.replace(/\s+className=\{[^}]*\}/g, '')
  // {...props} → strip
  out = out.replace(/\s+\{\.\.\.props\}/g, '')

  // JSX comments {/* ... */} → HTML comments (guard against stray props anyway)
  out = out.replace(/\{\s*\/\*([\s\S]*?)\*\/\s*\}/g, '<!--$1-->')

  // style={{ ... }} → :style="{ ... }". The JS object body is copied as-is
  // into the Vue `:style="..."` attribute, so inner double quotes would
  // collide with the attribute's own quotes. Swap to single quotes.
  out = out.replace(/style=\{(\{[^}]*\})\}/g, (_, body) => {
    const safeBody = body.replace(/"/g, "'")
    return `:style="${safeBody}"`
  })

  // variants={FOO_VARIANTS} → :variants="variants.foo" + record the ref.
  out = out.replace(/variants=\{([A-Z_][A-Z0-9_]*)\}/g, (_, name) => {
    const part = partNameFromConst(name)
    variantRefs.add(part)
    return `:variants="variants.${part}"`
  })

  // initial="normal" → initial="initial"
  out = out.replace(/initial="normal"/g, 'initial="initial"')

  // First `animate={controls}` also wires @animationComplete for loop support.
  let first = true
  out = out.replace(/animate=\{controls\}/g, () => {
    if (first) {
      first = false
      return `:animate="current"\n      @animationComplete="notifyComplete"`
    }
    return `:animate="current"`
  })

  // height={size} / width={size} → bind to prop
  out = out.replace(/height=\{size\}/g, ':height="props.size"')
  out = out.replace(/width=\{size\}/g, ':width="props.size"')

  // React camelCase SVG attrs → kebab (do before number-expression conversion).
  out = out
    .replace(/\bstrokeWidth=/g, 'stroke-width=')
    .replace(/\bstrokeLinecap=/g, 'stroke-linecap=')
    .replace(/\bstrokeLinejoin=/g, 'stroke-linejoin=')
    .replace(/\bstrokeDasharray=/g, 'stroke-dasharray=')
    .replace(/\bstrokeDashoffset=/g, 'stroke-dashoffset=')
    .replace(/\bstrokeOpacity=/g, 'stroke-opacity=')
    .replace(/\bfillOpacity=/g, 'fill-opacity=')
    .replace(/\bclipPath=/g, 'clip-path=')
    .replace(/\bclipRule=/g, 'clip-rule=')
    .replace(/\bfillRule=/g, 'fill-rule=')

  // Hard-coded stroke-width — bind to prop so consumer can override.
  //   stroke-width="2"   (pqoqubbw's string form)
  //   stroke-width={2}   (animate-ui's expression form)
  out = out
    .replace(/stroke-width="[\d.]+"/g, ':stroke-width="props.strokeWidth"')
    .replace(/stroke-width=\{[\d.]+\}/g, ':stroke-width="props.strokeWidth"')

  // custom={0.2} → :custom="0.2"  (generic numeric expression pass below
  // would catch this, but do it explicitly for clarity).
  out = out.replace(/\bcustom=\{(-?\d+(?:\.\d+)?)\}/g, ':custom="$1"')

  // Generic attr={<number>} → :attr="<value>".
  out = out.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)=\{(-?\d+(?:\.\d+)?)\}/g, '$1:$2="$3"')

  // Generic attr={IDENTIFIER} → :attr="IDENTIFIER". Lets module-level
  // consts like `TRANSITION` pass through — we hoist the declaration into
  // the SFC's <script setup> so the binding resolves at runtime.
  out = out.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)=\{([A-Za-z_][A-Za-z0-9_]*)\}/g, '$1:$2="$3"')

  // Drop any stray JSX expression containers we missed — they'd break the
  // Vue template parser. Log so we notice.
  if (/=\{[^}]+\}/.test(out)) {
    // Leave them in; caller can decide to bail.
  }

  return out
}

/** Emit the full SFC string. */
function emitSfc({ pascal, svgTemplate, animationsSrc, auxConsts }) {
  const prelude = auxConsts.length ? `\n${auxConsts.map(c => c.decl).join('\n\n')}\n` : ''
  // Include Transition only when an aux const uses it; keeps unused-import
  // warnings off the vast majority of icons that don't need it.
  const needsTransition = auxConsts.some(c => /:\s*Transition\b/.test(c.decl))
  const motionImports = needsTransition
    ? `import { motion, type Transition, type Variants } from 'motion-v'`
    : `import { motion, type Variants } from 'motion-v'`

  return `<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: \`normal\` → \`initial\`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
import { computed } from 'vue'
${motionImports}
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
${prelude}
const animations = ${animationsSrc} satisfies Record<string, Record<string, Variants>>

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
  >
    <${pascal} :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  ${svgTemplate}
</template>
`
}

/**
 * Convert `<svg ...>` → `<motion.svg v-else ...>` or
 * `<motion.svg ...>` → `<motion.svg v-else ...>` (adding the directive).
 */
function addVElse(svgJsx, kind) {
  if (kind === 'motion-svg') {
    return svgJsx.replace(/^<motion\.svg\b/, '<motion.svg\n    v-else')
  }
  return svgJsx
    .replace(/^<svg\b/, '<motion.svg\n    v-else')
    .replace(/<\/svg>$/, '</motion.svg>')
}

function portOne(kebab) {
  const pascal = kebabToPascal(kebab)
  const srcPath = join(UPSTREAM_DIR, 'icons', `${kebab}.tsx`)
  if (!existsSync(srcPath)) throw new Error('no upstream file')
  const src = readFileSync(srcPath, 'utf8')

  // Bail on sequenced icons (ban, etc.): multiple controls.start() calls
  // inside handleMouseEnter. Our single-current-state model can't sequence
  // without flattening into a single keyframed variant — defer to hand-port.
  const enterBlock = src.match(/handleMouseEnter\s*=\s*useCallback[\s\S]*?\[[\s\S]*?\]/)
  if (enterBlock) {
    const starts = enterBlock[0].match(/controls\.start\(/g) || []
    if (starts.length > 1) throw new Error('sequenced: multiple controls.start')
  }

  // Bail if any motion element uses an inline variants={{...}} object rather
  // than a named const. Parsing those is mechanical but gets hairy with
  // dedup/hoist; waves is the main offender. Hand-port later.
  if (/variants=\{\{/.test(src)) throw new Error('inline variants={{...}}')

  // Bail on multi-controls icons: pqoqubbw's brand icons (instagram, twitch,
  // dribbble, etc.) create separate `useAnimation()` controllers per element
  // so each part can play on a different schedule. Our context exposes a
  // single `current` ref, so the parts can't be independently triggered —
  // hand-port if we want them.
  const useAnimationCalls = (src.match(/\buseAnimation\s*\(\s*\)/g) || []).length
  if (useAnimationCalls > 1) throw new Error('multi-controls (multiple useAnimation)')

  const consts = extractVariantConsts(src)
  if (Object.keys(consts).length === 0) throw new Error('no Variants consts found')
  const auxConsts = extractAuxConsts(src)

  // Each const must have keys strictly in {normal, animate}. Bail otherwise
  // (e.g. ban's LINE_VARIANTS has {normal, slash}).
  for (const [name, info] of Object.entries(consts)) {
    const keys = variantStateKeys(info.body)
    const allowed = new Set(['normal', 'animate'])
    for (const k of keys) {
      if (!allowed.has(k)) throw new Error(`non-standard variant state: ${name}.${k}`)
    }
    if (!keys.includes('animate')) throw new Error(`${name} missing 'animate' state`)
  }

  const { kind, jsx } = extractSvgJsx(src)

  // Rewrite variants blocks: normal→initial.
  const parts = {}
  for (const [name, info] of Object.entries(consts)) {
    const part = partNameFromConst(name)
    parts[part] = renameNormalToInitial(info.body)
  }

  // Transform the JSX subtree.
  const variantRefs = new Set()
  let tpl = jsxToVueTemplate(jsx, variantRefs)
  tpl = addVElse(tpl, kind)

  // If jsxToVueTemplate left any stray JSX expression containers we missed,
  // fail loudly so we notice. Whitelist known-safe ones first.
  const stray = tpl.match(/=\{[^}]+\}/)
  if (stray) throw new Error(`stray JSX expression: ${stray[0]}`)

  // Prune parts that the JSX doesn't actually reference (sometimes an unused
  // const slips in — rare but harmless to drop).
  for (const key of Object.keys(parts)) {
    if (!variantRefs.has(key)) delete parts[key]
  }
  if (Object.keys(parts).length === 0) throw new Error('no part references survived')

  // Build `animations = { default: { <part>: {<body>}, ... } }`.
  const partsSrc = Object.entries(parts)
    .map(([part, body]) => `    ${part}: {${body}},`)
    .join('\n')
  const animationsSrc = `{
  default: {
${partsSrc}
  } satisfies Record<string, Variants>,
}`

  const sfc = emitSfc({ pascal, svgTemplate: tpl, animationsSrc, auxConsts })

  const outPath = join(OUT_DIR, `${kebab}.vue`)
  if (existsSync(outPath)) {
    // Never clobber hand-ported files. These carry manual tweaks (e.g.
    // softened bookmark amplitude) that the codemod would regress.
    const existing = readFileSync(outPath, 'utf8')
    if (existing.includes('Hand-ported') || existing.includes('Hand-written')) {
      return { kebab, pascal, status: 'skipped-hand' }
    }
    if (!force) return { kebab, pascal, status: 'skipped-exists' }
  }
  writeFileSync(outPath, sfc)
  return { kebab, pascal, status: 'written' }
}

/**
 * Parse the current icons-meta.ts and return all rows as a map, so we can
 * splice in lucide-animated additions without disturbing animate-ui or
 * hand-written rows.
 */
function readAllRows() {
  if (!existsSync(META_FILE)) return new Map()
  const src = readFileSync(META_FILE, 'utf8')
  const rowRe = /\{\s*kebab:\s*'([^']+)',\s*pascal:\s*'([^']+)',\s*animations:\s*\[([^\]]+)\]\s*\},/g
  const animRe = /\{\s*name:\s*'([^']+)',\s*source:\s*'([^']+)'\s*\}/g
  const rows = new Map()
  for (const m of src.matchAll(rowRe)) {
    const [, kebab, pascal, animsStr] = m
    const anims = [...animsStr.matchAll(animRe)].map(a => ({ name: a[1], source: a[2] }))
    rows.set(kebab, { kebab, pascal, anims })
  }
  return rows
}

function updateMeta(written) {
  const rows = readAllRows()
  for (const r of written) {
    if (rows.has(r.kebab)) continue // don't clobber existing rows
    rows.set(r.kebab, {
      kebab: r.kebab,
      pascal: r.pascal,
      anims: [{ name: 'default', source: 'lucide-animated' }],
    })
  }
  const entries = [...rows.values()]
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
 * GENERATED by scripts/port-icons.mjs and scripts/port-pqoqubbw-icons.mjs —
 * hand-edits survive reruns as long as the source is not 'animate-ui'.
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
  writeFileSync(META_FILE, content)
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
export {
  iconsMeta,
  type IconAnimation,
  type IconMeta,
  type IconSource,
} from './icons-meta'

// icons (auto-generated)
${body}
`
  writeFileSync(INDEX_FILE, content)
}

// --- main ---
mkdirSync(OUT_DIR, { recursive: true })
ensureUpstream()

const dirs = readdirSync(join(UPSTREAM_DIR, 'icons'))
  .filter(f => f.endsWith('.tsx'))
  .map(f => f.replace(/\.tsx$/, ''))
  .filter(kebab => !onlySet || onlySet.has(kebab))
  .sort()
  .slice(0, limit)

const results = { written: 0, 'skipped-exists': 0, failed: [] }
const written = []
for (const kebab of dirs) {
  try {
    const r = portOne(kebab)
    results[r.status] = (results[r.status] || 0) + 1
    if (r.status === 'written') written.push(r)
  } catch (e) {
    results.failed.push({ kebab, reason: e.message })
  }
}

if (written.length) {
  updateMeta(written)
  regenerateIndex()
}

console.log(`
Scanned ${dirs.length} upstream icons:
  written:        ${results.written}
  skipped-exists: ${results['skipped-exists']}
  failed:         ${results.failed.length}
`)
if (results.failed.length) {
  // Group failures by reason prefix for easier scanning.
  const byReason = new Map()
  for (const f of results.failed) {
    const key = f.reason.split(':')[0]
    if (!byReason.has(key)) byReason.set(key, [])
    byReason.get(key).push(f.kebab)
  }
  console.log('Failures by category:')
  for (const [reason, names] of [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${reason} (${names.length}):  ${names.slice(0, 8).join(', ')}${names.length > 8 ? ', …' : ''}`)
  }
}
