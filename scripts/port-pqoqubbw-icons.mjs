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
  // Match any module-level `const NAME[: Type] = <initializer>;` where the
  // initializer can be an object, scalar, arrow function, function call, or
  // array. We walk forward from the `=` respecting nested braces/parens/
  // brackets/strings/comments until we hit a top-level `;`. Shapes observed:
  //   const DURATION = 0.3;
  //   const TRANSITION: Transition = { duration: 0.3, ease: 'linear' };
  //   const CALCULATE_DELAY = (i: number) => { ... };
  //   const CUSTOM_EASING = cubicBezier(0.25, 0.1, 0.25, 1);
  // Skipped: Variants consts (handled separately in extractVariantConsts).
  const re = /^const\s+([A-Z_][A-Z0-9_]*)(\s*:\s*[A-Za-z_][\w<>, ]*)?\s*=\s*/gm
  let m
  while ((m = re.exec(src)) !== null) {
    if (/:\s*Variants\s*=/.test(m[0])) continue
    const name = m[1]
    const ann = m[2] || ''
    const bodyStart = m.index + m[0].length
    let end = bodyStart
    let depth = 0, inStr = null, inLC = false, inBC = false
    for (; end < src.length; end++) {
      const c = src[end], n = src[end + 1]
      if (inLC) { if (c === '\n') inLC = false; continue }
      if (inBC) { if (src[end - 1] === '*' && c === '/') inBC = false; continue }
      if (inStr) {
        if (c === '\\') { end++; continue }
        if (c === inStr) inStr = null
        continue
      }
      if (c === '/' && n === '/') { inLC = true; continue }
      if (c === '/' && n === '*') { inBC = true; continue }
      if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
      if (c === '{' || c === '(' || c === '[') depth++
      else if (c === '}' || c === ')' || c === ']') depth--
      else if (depth === 0 && c === ';') break
    }
    const body = src.slice(bodyStart, end).trimEnd()
    // Preserve the TS annotation (e.g. `: Transition`) so literal-type
    // narrowing doesn't trip strict motion-v types.
    out.push({ name, decl: `const ${name}${ann} = ${body};` })
  }
  return out
}

/**
 * Rewrite inline `variants={{...}}` attributes on motion elements into
 * a sentinel `variants={__INLINE__<partName>}` token, deduplicating
 * identical bodies so three motion.paths sharing the same variants map to
 * one `path` part. The first unique body becomes `path`, subsequent uniques
 * become `path2`, `path3`, etc.
 *
 * We use a dedicated sentinel (not a synthetic UPPER_SNAKE name) so names
 * with digits or camelCase survive the trip into jsxToVueTemplate without
 * being re-lowercased by partNameFromConst.
 *
 * Returns { jsx: rewritten, parts: { partName → body } } where `body` is
 * the text between the outer object braces — matching extractVariantConsts'
 * shape so downstream code can treat both uniformly.
 */
function rewriteInlineVariants(jsx) {
  const parts = {}
  const bodyToPart = new Map()
  let out = ''
  let i = 0
  let counter = 0
  while (i < jsx.length) {
    const idx = jsx.indexOf('variants={{', i)
    if (idx < 0) { out += jsx.slice(i); break }
    const innerOpen = idx + 'variants={'.length // points at inner '{'
    const { block, end } = extractBalanced(jsx, innerOpen)
    if (jsx[end] !== '}') throw new Error('expected } after inline variants body')
    const body = block.slice(1, -1)
    const norm = body.replace(/\s+/g, ' ').trim()
    let partName = bodyToPart.get(norm)
    if (!partName) {
      counter++
      partName = counter === 1 ? 'path' : `path${counter}`
      bodyToPart.set(norm, partName)
      parts[partName] = body
    }
    out += jsx.slice(i, idx) + `variants={__INLINE__${partName}}`
    i = end + 1
  }
  return { jsx: out, parts }
}

/**
 * Strip inline `initial={{...}}` attributes. Pqoqubbw declares these as a
 * belt-and-suspenders companion to `variants.normal` — motion-v resolves
 * `variants.initial` (after our rename) at mount, so the literal is
 * redundant and simplifying it avoids a second JSX expression the codemod
 * would have to transform.
 */
function stripInlineInitial(jsx) {
  let out = ''
  let i = 0
  while (i < jsx.length) {
    const idx = jsx.indexOf('initial={{', i)
    if (idx < 0) { out += jsx.slice(i); break }
    // Only strip when this looks like an attribute (preceded by whitespace).
    if (idx > 0 && !/\s/.test(jsx[idx - 1])) {
      out += jsx.slice(i, idx + 1)
      i = idx + 1
      continue
    }
    const innerOpen = idx + 'initial={'.length
    const { end } = extractBalanced(jsx, innerOpen)
    if (jsx[end] !== '}') throw new Error('expected } after inline initial body')
    // Trim the leading whitespace/indent before `initial` so the element
    // doesn't end up with a blank line where the attribute used to be.
    let trim = idx
    while (trim > 0 && /[\t ]/.test(jsx[trim - 1])) trim--
    if (trim > 0 && jsx[trim - 1] === '\n') trim--
    out += jsx.slice(i, trim)
    i = end + 1
  }
  return out
}

/**
 * Rewrite an inline object attribute `attrName={{...}}` into a Vue binding
 * `:attrName="{...}"`. Used for `transition={{...}}` which pqoqubbw sprinkles
 * on motion elements alongside a named-const variants binding — motion-v
 * Vue supports `:transition="{...}"` as an element-level default.
 */
function rewriteInlineObjectAttr(jsx, attrName) {
  let out = ''
  let i = 0
  const needle = `${attrName}={{`
  while (i < jsx.length) {
    const idx = jsx.indexOf(needle, i)
    if (idx < 0) { out += jsx.slice(i); break }
    if (idx > 0 && !/\s/.test(jsx[idx - 1])) {
      out += jsx.slice(i, idx + 1)
      i = idx + 1
      continue
    }
    const innerOpen = idx + attrName.length + 2 // skip `attrName={` → inner '{'
    const { block, end } = extractBalanced(jsx, innerOpen)
    if (jsx[end] !== '}') throw new Error(`expected } after inline ${attrName} body`)
    const safe = block.replace(/"/g, "'")
    out += jsx.slice(i, idx) + `:${attrName}="${safe}"`
    i = end + 1
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

  // variants={__INLINE__<partName>} → :variants="variants.<partName>".
  // Sentinel preserves the exact camelCase name from rewriteInlineVariants.
  out = out.replace(/variants=\{__INLINE__([A-Za-z0-9]+)\}/g, (_, part) => {
    variantRefs.add(part)
    return `:variants="variants.${part}"`
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
  // Detect motion-v runtime utilities referenced from aux decls (cubicBezier,
  // spring, etc). Pqoqubbw imports these from 'motion/react'; motion-v
  // re-exports them under the same names.
  const MOTION_UTILS = ['cubicBezier', 'spring', 'wrap', 'clamp', 'mix']
  const neededUtils = MOTION_UTILS.filter(u =>
    auxConsts.some(c => new RegExp(`\\b${u}\\s*\\(`).test(c.decl)),
  )
  const imports = ['motion']
  for (const u of neededUtils) imports.push(u)
  if (needsTransition) imports.push('type Transition')
  imports.push('type Variants')
  const motionImports = `import { ${imports.join(', ')} } from 'motion-v'`

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

  // Bail on multi-controls icons: pqoqubbw's brand icons (instagram, twitch,
  // dribbble, etc.) create separate `useAnimation()` controllers per element
  // so each part can play on a different schedule. Our context exposes a
  // single `current` ref, so the parts can't be independently triggered —
  // hand-port if we want them.
  const useAnimationCalls = (src.match(/\buseAnimation\s*\(\s*\)/g) || []).length
  if (useAnimationCalls > 1) throw new Error('multi-controls (multiple useAnimation)')

  const consts = extractVariantConsts(src)
  const auxConsts = extractAuxConsts(src)

  // Each named const must have keys strictly in {normal, animate}. Bail
  // otherwise (e.g. ban's LINE_VARIANTS has {normal, slash}).
  for (const [name, info] of Object.entries(consts)) {
    const keys = variantStateKeys(info.body)
    const allowed = new Set(['normal', 'animate'])
    for (const k of keys) {
      if (!allowed.has(k)) throw new Error(`non-standard variant state: ${name}.${k}`)
    }
    if (!keys.includes('animate')) throw new Error(`${name} missing 'animate' state`)
  }

  const { kind, jsx } = extractSvgJsx(src)

  // Preprocess JSX: strip redundant inline `initial={{...}}`, hoist inline
  // `variants={{...}}` blocks into synthetic UPPER_SNAKE names (deduped),
  // convert inline `transition={{...}}` to a Vue `:transition` binding.
  let preJsx = stripInlineInitial(jsx)
  const { jsx: withInlineVariants, parts: inlineParts } = rewriteInlineVariants(preJsx)
  preJsx = rewriteInlineObjectAttr(withInlineVariants, 'transition')

  // Validate inline variant bodies the same way as named consts.
  for (const [part, body] of Object.entries(inlineParts)) {
    const keys = variantStateKeys(body)
    const allowed = new Set(['normal', 'animate'])
    for (const k of keys) {
      if (!allowed.has(k)) throw new Error(`non-standard inline variant state: ${part}.${k}`)
    }
    if (!keys.includes('animate')) throw new Error(`inline ${part} missing 'animate' state`)
  }

  if (Object.keys(consts).length === 0 && Object.keys(inlineParts).length === 0) {
    throw new Error('no Variants consts found')
  }

  // Rewrite variants blocks: normal→initial. Merge named + inline into one
  // parts map. Inline names are synthetic (`path`, `path2`, …) and can
  // collide with a named const's camelCase name (e.g. PATH_VARIANTS → path).
  // When that happens, rename the inline part + its JSX references so both
  // coexist — named keeps its derived name, inline bumps to a free slot.
  const parts = {}
  for (const [name, info] of Object.entries(consts)) {
    const part = partNameFromConst(name)
    parts[part] = renameNormalToInitial(info.body)
  }
  for (const [part, body] of Object.entries(inlineParts)) {
    let final = part
    let n = 2
    while (parts[final]) final = `${part}Inline${n++}`
    parts[final] = renameNormalToInitial(body)
    if (final !== part) {
      // preJsx holds `variants={__INLINE__<part>}` sentinels — retarget
      // them to the new slot so the downstream substitution picks it up.
      const from = `__INLINE__${part}}`
      const to = `__INLINE__${final}}`
      preJsx = preJsx.split(from).join(to)
    }
  }

  // Transform the JSX subtree.
  const variantRefs = new Set()
  let tpl = jsxToVueTemplate(preJsx, variantRefs)
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
