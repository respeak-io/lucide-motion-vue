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
// --augment=<kebab> [--variant-name=<name>]: don't write a full SFC; instead
// emit a printable variant block, re-keyed to the existing hand-written
// file's `pathN` bindings, for manual splice into the existing SFC.
const augment = (args.find(a => a.startsWith('--augment=')) || '').split('=')[1] || null
const augmentVariantName =
  (args.find(a => a.startsWith('--variant-name=')) || '').split('=')[1] || 'lucide-animated'

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
  // `^\s*const` — some pqoqubbw files declare UPPER_SNAKE data arrays inside
  // the component body (e.g. zap-off's `PATHS`). Those are indented but
  // still top-level to our purposes — hoisting them into <script setup>
  // keeps v-for sources resolvable without breaking anything, since the
  // originals don't close over component params.
  const re = /^\s*const\s+([A-Z_][A-Z0-9_]*)(\s*:\s*[A-Za-z_][\w<>, ]*)?\s*=\s*/gm
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
 * Rewrite React `{ARRAY.map((item, index) => (<JSX />))}` loops into a
 * Vue `v-for` directive on the JSX element. The array source can be a
 * module-level identifier (hoisted via extractAuxConsts) or an inline
 * `[...]` literal. Inline literals are extracted into synthetic
 * `VFOR_LIST_<n>` consts — otherwise double-quoted path strings inside
 * the array would collide with the attribute's own quotes. Only
 * single-element bodies are supported — if the map callback returns
 * anything other than one JSX element, we leave the source alone and
 * the stray-JSX detector will reject the icon.
 *
 * Returns { jsx: rewritten, hoistedArrays: [{ name, decl }] } — the
 * caller appends hoistedArrays to auxConsts.
 */
function rewriteReactMapLoops(jsx) {
  const hoistedArrays = []
  let out = ''
  let i = 0
  let hoistCounter = 0
  while (i < jsx.length) {
    const mapIdx = jsx.indexOf('.map(', i)
    if (mapIdx < 0) { out += jsx.slice(i); break }
    // Walk back from `.map(` to find the array expression, then the
    // enclosing `{` that opens the JSX expression container.
    let j = mapIdx - 1
    while (j >= 0 && /\s/.test(jsx[j])) j--
    let arrayStart = -1
    let arrayExpr = ''
    if (jsx[j] === ']') {
      let depth = 1, k = j - 1
      while (k >= 0) {
        const c = jsx[k]
        if (c === ']') depth++
        else if (c === '[') { depth--; if (depth === 0) break }
        k--
      }
      if (depth !== 0) { out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue }
      arrayStart = k
      // Hoist the inline array to a synthetic aux const — inline literals
      // with double-quoted strings (common for `d=` path lists) can't be
      // embedded as-is inside a double-quoted `v-for` attribute.
      hoistCounter++
      const hoistName = `VFOR_LIST_${hoistCounter}`
      hoistedArrays.push({ name: hoistName, decl: `const ${hoistName} = ${jsx.slice(k, j + 1)};` })
      arrayExpr = hoistName
    } else if (/[A-Za-z_$]/.test(jsx[j])) {
      let k = j
      while (k >= 0 && /[A-Za-z0-9_$.]/.test(jsx[k])) k--
      arrayStart = k + 1
      arrayExpr = jsx.slice(k + 1, j + 1)
    } else {
      out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue
    }
    let k = arrayStart - 1
    while (k >= 0 && /\s/.test(jsx[k])) k--
    if (jsx[k] !== '{') { out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue }
    const blockOpen = k
    const afterMap = mapIdx + 5 // past `.map(`
    const argMatch = jsx.slice(afterMap).match(/^\s*\(([^)]*)\)\s*=>\s*\(/)
    if (!argMatch) { out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue }
    const argsStr = argMatch[1].trim()
    const jsxStart = afterMap + argMatch[0].length
    let blockEnd
    try { ({ end: blockEnd } = extractBalanced(jsx, blockOpen)) }
    catch { out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue }
    // Body sits between the arrow's `(` and the final `))}` — back up three
    // chars (`))}`) from the outer `}` to land at the end of the JSX.
    const innerJsxRaw = jsx.slice(jsxStart, blockEnd - 3).trim()
    const tagMatch = innerJsxRaw.match(/^(<[A-Za-z][\w.]*)/)
    if (!tagMatch) { out += jsx.slice(i, mapIdx + 5); i = mapIdx + 5; continue }
    // Drop React's `key={…}` — v-for + `:key` is the Vue equivalent; keep
    // whichever expression was there as the Vue `:key`. Brace-balanced
    // because template-literal keys like `key={`${a}-${b}`}` have `}` that
    // closes the `${...}` interpolation — a greedy `[^}]+` regex snaps off
    // at the wrong brace.
    let keyExpr = null
    let inner = innerJsxRaw
    const keyIdx = inner.search(/\s+key=\{/)
    if (keyIdx >= 0) {
      const braceIdx = inner.indexOf('{', keyIdx)
      const { block, end } = extractBalanced(inner, braceIdx)
      keyExpr = block.slice(1, -1).trim()
      inner = inner.slice(0, keyIdx) + inner.slice(end)
    }
    const vforRhs = `${argsStr.includes(',') ? `(${argsStr})` : argsStr} in ${arrayExpr}`
    const insertAt = tagMatch[0].length
    const vforAttr = `\n      v-for="${vforRhs}"` + (keyExpr ? `\n      :key="${keyExpr}"` : '')
    const newInner = inner.slice(0, insertAt) + vforAttr + inner.slice(insertAt)
    out += jsx.slice(i, blockOpen) + newInner
    i = blockEnd
  }
  return { jsx: out, hoistedArrays }
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
  const camel = base.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
  // Avoid `variants.variants` — a few pqoqubbw icons (grip, grip-horizontal,
  // grip-vertical) declare a plain `const VARIANTS: Variants = {...}`. Rename
  // that lone case to `part` so the template reads `variants.part`.
  return camel === 'variants' ? 'part' : camel
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

  // className={cn(...)}  → strip (expression form)
  out = out.replace(/\s+className=\{[^}]*\}/g, '')
  // className="..."  → strip (string form, e.g. `className="overflow-visible"`).
  // We inject our own overflow handling on the svg root, so upstream hints
  // are redundant and would leak into the Vue output verbatim.
  out = out.replace(/\s+className="[^"]*"/g, '')
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

  // Generic attr={<expression>} → :attr="<expression>". Catches the leftover
  // patterns that v-for loop bodies produce: `d={path.d}`, `custom={i + 1}`,
  // `custom={b.delay}`, etc. We accept any non-brace content, swap inner
  // double quotes to singles so the Vue attribute quotes survive.
  out = out.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)=\{([^{}]+)\}/g, (_, ws, name, expr) => {
    const safe = expr.replace(/"/g, "'")
    return `${ws}:${name}="${safe}"`
  })

  // Drop any stray JSX expression containers we missed — they'd break the
  // Vue template parser. Log so we notice.
  if (/=\{[^}]+\}/.test(out)) {
    // Leave them in; caller can decide to bail.
  }

  return out
}

/** Emit the full SFC string. `upstreamKebab` is recorded in a machine-
 * readable header comment so re-runs can tell which upstream each
 * pqoqubbw-sourced SFC (and each numbered sibling) was derived from,
 * and skip writing a duplicate. */
function emitSfc({ pascal, svgTemplate, animationsSrc, auxConsts, upstreamKebab }) {
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
// Upstream source: ${upstreamKebab}
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
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
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
 * Also inject `overflow="visible"` so animations that draw outside the
 * 24×24 viewBox (ambulance speed lines, party-popper confetti, etc.) don't
 * get clipped by the user-agent's default `svg { overflow: hidden }` rule.
 */
function addVElse(svgJsx, kind) {
  const marker = '<motion.svg\n    v-else\n    overflow="visible"'
  let out
  if (kind === 'motion-svg') {
    out = svgJsx.replace(/^<motion\.svg\b/, marker)
  } else {
    out = svgJsx
      .replace(/^<svg\b/, marker)
      .replace(/<\/svg>$/, '</motion.svg>')
  }
  // Defensive: a handful of upstream icons (e.g. facebook) ship the svg
  // tag without a viewBox. Without one the icon collapses to its native
  // size and the smoke test's viewBox assertion (rightly) fails.
  if (!/\bviewBox=/.test(out)) {
    out = out.replace(/^<motion\.svg\b/, '<motion.svg\n    viewBox="0 0 24 24"')
  }
  return out
}

/**
 * Port a single upstream pqoqubbw icon.
 *   - `upstreamKebab`: the file name we look up in the upstream clone.
 *   - `outKebab`:      the file name we write under (defaults to upstreamKebab).
 *     Pass a different `outKebab` when writing a numbered sibling — e.g.
 *     port upstream `send.tsx` out as our `send-2.vue` / `Send2` component
 *     because upstream's geometry doesn't structurally align with our
 *     existing `send.vue` and augment fell through.
 */
function portOne(upstreamKebab, outKebab = upstreamKebab) {
  const kebab = outKebab
  const pascal = kebabToPascal(outKebab)
  const srcPath = join(UPSTREAM_DIR, 'icons', `${upstreamKebab}.tsx`)
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

  // Preprocess JSX: unwrap React `{ARRAY.map(...)}` loops into Vue `v-for`;
  // strip redundant inline `initial={{...}}`; hoist inline `variants={{...}}`
  // blocks into synthetic names (deduped); convert inline object attrs like
  // `transition={{...}}` and `custom={{...}}` to Vue bindings.
  const mapPass = rewriteReactMapLoops(jsx)
  let preJsx = stripInlineInitial(mapPass.jsx)
  const { jsx: withInlineVariants, parts: inlineParts } = rewriteInlineVariants(preJsx)
  preJsx = rewriteInlineObjectAttr(withInlineVariants, 'transition')
  preJsx = rewriteInlineObjectAttr(preJsx, 'custom')
  auxConsts.push(...mapPass.hoistedArrays)

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

  const sfc = emitSfc({ pascal, svgTemplate: tpl, animationsSrc, auxConsts, upstreamKebab })

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
  writeMetaRows(rows)
}

/** Serialize a rows map back to icons-meta.ts. Kept separate from
 * updateMeta because augment needs to mutate a specific row without going
 * through "add missing rows" logic. */
function writeMetaRows(rows) {
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

/**
 * Augment mode: upstream adds an animated variant to an icon we've already
 * hand-written. Rather than overwriting the SFC (the port script's skip-hand
 * guard forbids that) or asking the author to eyeball-translate upstream's
 * VARIANTS blocks onto our `pathN` keys, we parse both sides and emit a
 * ready-to-paste snippet whose keys are already re-mapped to the hand-written
 * file's binding names. The final splice is still manual — the script prints,
 * it doesn't patch — so review stays in the author's hands.
 */

/**
 * Read the existing SFC for `kebab` and return the shape we need to augment
 * it with a new variant. Accepts three SFC lineages:
 *   - 'Hand-written' / 'Hand-ported' (user-authored)
 *   - 'Auto-generated from animate-ui' (port-icons.mjs output)
 * Rejects 'Auto-generated from pqoqubbw' — those are already lucide-animated
 * and augment would be a no-op. Missing/unknown sentinels also reject; a
 * file with no recognisable origin isn't safe to splice into blindly.
 *
 * Returns:
 *   - handParts:  doc-ordered [{ tag, partKey, d | null }] for every
 *                 <motion.X :variants="variants.Y"> — lets the augment
 *                 pair with upstream parts by position, not geometry.
 *   - pathKeyToD, groupKey: preserved for legacy/debug paths.
 *   - existingVariants: Set<string> of top-level keys in `const animations`.
 *   - src:        full file contents (augment write-back path splices here).
 *   - path:       absolute path for log messages.
 */
function readHandWritten(kebab) {
  const outPath = join(OUT_DIR, `${kebab}.vue`)
  if (!existsSync(outPath)) throw new Error(`no existing SFC at ${outPath}`)
  const src = readFileSync(outPath, 'utf8')
  if (src.includes('Auto-generated from pqoqubbw')) {
    throw Object.assign(
      new Error(`${outPath} is already a pqoqubbw auto-port — skip`),
      { alreadyLucide: true },
    )
  }
  const hasSentinel =
    src.includes('Hand-written') ||
    src.includes('Hand-ported') ||
    src.includes('Auto-generated from animate-ui')
  if (!hasSentinel) {
    throw new Error(`${outPath} has no recognised source sentinel — refusing to augment`)
  }

  const tplStart = src.indexOf('<template>')
  const tplEnd = src.indexOf('</template>')
  if (tplStart < 0 || tplEnd < 0) throw new Error('no <template> block in existing SFC')
  const tpl = src.slice(tplStart, tplEnd)

  // Single pass over every motion.X element in the template, in document
  // order. Capture its tag, the partKey it binds to (if any), and — for
  // <motion.path> — its `d` attribute so we can detect geometry drift later.
  // The regex matches both self-closing (<motion.path .../>) and open
  // (<motion.g ...>) forms; we only care about the opening tag so it's fine
  // to stop at the first `>` or `/>`.
  const handParts = []
  const pathKeyToD = new Map()
  let groupKey = null
  for (const m of tpl.matchAll(/<motion\.([a-z]+)\b([\s\S]*?)(?:\/>|>)/g)) {
    const tag = m[1]
    const attrs = m[2]
    const varMatch = attrs.match(/:variants="variants\.([A-Za-z0-9_]+)"/)
    if (!varMatch) continue
    const partKey = varMatch[1]
    const dMatch = attrs.match(/\bd="([^"]+)"/)
    const d = dMatch ? dMatch[1].trim() : null
    handParts.push({ tag, partKey, d })
    if (tag === 'path' && d) pathKeyToD.set(partKey, d)
    if (tag !== 'path' && !groupKey) groupKey = partKey
  }
  if (handParts.length === 0) throw new Error('no <motion.X :variants="..."> found in existing template')

  const animIdx = src.indexOf('const animations = {')
  if (animIdx < 0) throw new Error('no `const animations = {` in hand-written SFC')
  const braceIdx = src.indexOf('{', animIdx)
  const { block } = extractBalanced(src, braceIdx)
  // variantStateKeys' string-tracking treats a leading `'` as entering a
  // string and misses quoted top-level keys like `'lucide-animated':`. Use a
  // local walk that matches ident + quoted forms before entering string mode.
  // Strip comments up front so an apostrophe in a comment (e.g. "flame's")
  // doesn't trip the string tracker.
  const existingVariants = new Set()
  {
    const body = block
      .slice(1, -1)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    const keyRe = /^(?:\s*,)?\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:/
    let depth = 0, inStr = null
    for (let i = 0; i < body.length; ) {
      const c = body[i]
      if (depth === 0 && !inStr) {
        const m = body.slice(i).match(keyRe)
        if (m) { existingVariants.add(m[1] || m[2] || m[3]); i += m[0].length; continue }
      }
      if (inStr) {
        if (c === '\\') { i += 2; continue }
        if (c === inStr) inStr = null
        i++; continue
      }
      if (c === '"' || c === "'") { inStr = c; i++; continue }
      if (c === '{' || c === '(' || c === '[') { depth++; i++; continue }
      if (c === '}' || c === ')' || c === ']') { depth--; i++; continue }
      i++
    }
  }

  return { handParts, pathKeyToD, groupKey, existingVariants, src, path: outPath }
}

/**
 * Parse `<kebab>.tsx` from the upstream clone and return the shape we need
 * to remap it onto an existing SFC:
 *   - orderedParts: doc-order [{ tag, partName, d | null }] for every
 *                   <motion.X> that binds a `variants={...}` — covers
 *                   motion.svg, motion.g (pqoqubbw's send lifts the whole
 *                   group), motion.path, etc. This is what the positional
 *                   pairing in augmentOne consumes.
 *   - partBodies:   Map<partName, variantBody>, already normal→initial
 *                   renamed, ready to splice.
 * Bails out on the same upstream shapes portOne does — sequenced icons,
 * multi-controls icons, non-{normal,animate} variant states.
 */
function upstreamVariantShape(kebab) {
  const srcPath = join(UPSTREAM_DIR, 'icons', `${kebab}.tsx`)
  if (!existsSync(srcPath)) throw new Error(`no upstream file at ${srcPath}`)
  const src = readFileSync(srcPath, 'utf8')

  const enterBlock = src.match(/handleMouseEnter\s*=\s*useCallback[\s\S]*?\[[\s\S]*?\]/)
  if (enterBlock) {
    const starts = enterBlock[0].match(/controls\.start\(/g) || []
    if (starts.length > 1) throw new Error('sequenced upstream: multiple controls.start — can\'t augment')
  }
  if ((src.match(/\buseAnimation\s*\(\s*\)/g) || []).length > 1) {
    throw new Error('multi-controls upstream — can\'t augment')
  }

  const consts = extractVariantConsts(src)
  for (const [name, info] of Object.entries(consts)) {
    const keys = variantStateKeys(info.body)
    for (const k of keys) {
      if (k !== 'normal' && k !== 'animate') throw new Error(`non-standard variant state upstream: ${name}.${k}`)
    }
    if (!keys.includes('animate')) throw new Error(`upstream ${name} missing 'animate' state`)
  }

  const { jsx } = extractSvgJsx(src)
  const preJsx0 = stripInlineInitial(jsx)
  const { jsx: preJsx, parts: inlineParts } = rewriteInlineVariants(preJsx0)

  const partBodies = new Map()
  for (const [name, info] of Object.entries(consts)) {
    partBodies.set(partNameFromConst(name), renameNormalToInitial(info.body))
  }
  for (const [part, body] of Object.entries(inlineParts)) {
    partBodies.set(part, renameNormalToInitial(body))
  }

  const variantRe = /variants=\{(?:([A-Z_][A-Z0-9_]*)|__INLINE__([A-Za-z0-9]+))\}/
  const resolvePart = match => {
    if (match[1]) return partNameFromConst(match[1])
    return match[2]
  }

  // Doc-ordered sweep across every motion.X with a variants binding.
  // Matches both self-closing (`<motion.path ... />`) and open
  // (`<motion.g ...>`) forms — we only care about the opening tag here.
  const orderedParts = []
  for (const m of preJsx.matchAll(/<motion\.([a-z]+)\b([\s\S]*?)(?:\/>|>)/g)) {
    const tag = m[1]
    const attrs = m[2]
    const v = attrs.match(variantRe)
    if (!v) continue
    const partName = resolvePart(v)
    const dMatch = attrs.match(/\bd="([^"]+)"/)
    orderedParts.push({ tag, partName, d: dMatch ? dMatch[1].trim() : null })
  }

  return { orderedParts, partBodies }
}

/** Treat svg/g as interchangeable "container" tags when checking structural
 * alignment. The hand-written rocket uses <motion.g :variants="group">;
 * other icons bind the same kind of motion on <motion.svg>. For pairing
 * purposes they play the same role. */
function tagsCompatible(a, b) {
  if (a === b) return true
  const container = new Set(['svg', 'g'])
  return container.has(a) && container.has(b)
}

/** Compare two SVG `d` strings by their first N non-whitespace characters.
 * Used for the geometry-drift notice — not an exact check, just a sniff for
 * "these are probably the same shape". */
function dPrefixMatches(a, b, n = 12) {
  const norm = s => s.replace(/\s+/g, '')
  return norm(a).slice(0, n) === norm(b).slice(0, n)
}

/** Splice a new top-level variant (rendered block) into the existing
 * `const animations = { ... }` block, just before the outer closing brace.
 * The caller supplies the fully-rendered variant block including the
 * trailing comma; we take care of indentation + placement. */
function spliceVariantIntoSfc(src, variantBlock) {
  const animIdx = src.indexOf('const animations = {')
  if (animIdx < 0) throw new Error('no `const animations = {` block in SFC')
  const braceIdx = src.indexOf('{', animIdx)
  const { end } = extractBalanced(src, braceIdx)
  // `end` sits one past the outer closing `}`. Insert the rendered block
  // just before that `}`, preserving the existing formatting.
  const insertAt = end - 1
  return src.slice(0, insertAt) + `  ${variantBlock}\n` + src.slice(insertAt)
}

/** Append a new animation entry to an existing row in icons-meta.ts.
 * Idempotent: no-op if the row already lists an animation with the same
 * `name`. Throws if the row is missing — we don't silently create rows for
 * augment (callers should have ensured the row exists). */
function appendMetaAnim(kebab, anim) {
  const rows = readAllRows()
  const row = rows.get(kebab)
  if (!row) throw new Error(`icons-meta.ts has no row for '${kebab}' — can't append animation`)
  if (row.anims.some(a => a.name === anim.name)) return false
  row.anims.push(anim)
  writeMetaRows(rows)
  return true
}

/**
 * Augment mode. Pairs upstream parts to the existing SFC's parts positionally
 * (in document order) rather than by geometry — variants are just motion
 * specs, so a lucide-animated variant can legitimately drive animate-ui
 * geometry. Two failure modes matter:
 *   - `alreadyHasVariant`: the SFC already has a variant with this name.
 *     Skippable.
 *   - `structuralMismatch`: upstream has a different count or tag sequence
 *     (e.g. pqoqubbw's send has a 3rd <motion.path> swoosh that doesn't
 *     exist in the animate-ui geometry). Caller falls back to a numbered
 *     sibling icon — see processOne.
 * `driftNotes` are geometry divergences (same tag and position, but `d`
 * prefixes differ) that don't block augment but are worth reviewing.
 * `mode: 'print'` keeps the original CLI behaviour of emitting a
 * paste-ready snippet; `mode: 'write'` splices into the SFC and updates
 * icons-meta in place.
 */
function augmentOne(kebab, variantName, { mode = 'print' } = {}) {
  const hand = readHandWritten(kebab)
  if (hand.existingVariants.has(variantName)) {
    throw Object.assign(
      new Error(`variant '${variantName}' already exists in ${hand.path}`),
      { alreadyHasVariant: true },
    )
  }

  const up = upstreamVariantShape(kebab)

  // Split into containers (non-path motion elements — the animate-ui port
  // almost always wraps its shapes in <motion.g :variants="group"> even
  // when pqoqubbw has no equivalent wrapper) and paths. Pair each bucket
  // positionally: container ↔ container, path ↔ path. This lets icons
  // whose only "difference" is a decorative <motion.g> still merge as a
  // variant instead of being siblingised.
  const splitParts = arr => {
    const containers = [], paths = []
    for (const p of arr) (p.tag === 'path' ? paths : containers).push(p)
    return { containers, paths }
  }
  const handSplit = splitParts(hand.handParts)
  const upSplit = splitParts(up.orderedParts)

  // Path count must match exactly — upstream having extra paths means new
  // shapes we can't render against our template; fewer upstream paths means
  // hand has geometry upstream doesn't try to animate, which is fine
  // (unpaired hand paths just get an empty `{}` filler).
  if (upSplit.paths.length > handSplit.paths.length) {
    throw Object.assign(
      new Error(`upstream has ${upSplit.paths.length} paths, existing has only ${handSplit.paths.length}`),
      { structuralMismatch: true },
    )
  }
  // Upstream extra containers = upstream motion we have no slot for
  // (upstream binds variants on an extra motion.g/motion.svg that our
  // template lacks). Refuse rather than silently drop that motion.
  if (upSplit.containers.length > handSplit.containers.length) {
    throw Object.assign(
      new Error(`upstream has ${upSplit.containers.length} container-level variants, existing has only ${handSplit.containers.length}`),
      { structuralMismatch: true },
    )
  }

  // Shape-correspondence check: when upstream has strictly fewer paths
  // than hand, those upstream paths should still correspond to some hand
  // path — otherwise upstream is animating a different shape entirely
  // (pqoqubbw's send has a single "dashed swoosh trail" motion.path that
  // doesn't correspond to either of animate-ui's send-body paths). In
  // that case positional pairing would apply swoosh-motion to the send
  // body and the result looks wrong. Require every upstream path to
  // d-prefix-match SOME hand path; otherwise fall through to sibling.
  // Equal-count path pairs skip this check — drift across equally-populated
  // sides is common (shrink's paths are reordered; check's move-to uses
  // lowercase `m` vs uppercase `M`) but the correspondence is still there.
  if (upSplit.paths.length > 0 && upSplit.paths.length < handSplit.paths.length) {
    const normD12 = d => d.replace(/\s+/g, '').slice(0, 12)
    const handPrefixes = new Set(handSplit.paths.filter(p => p.d).map(p => normD12(p.d)))
    for (const u of upSplit.paths) {
      if (!u.d) continue
      if (!handPrefixes.has(normD12(u.d))) {
        throw Object.assign(
          new Error(`upstream path d="${u.d.slice(0, 32)}..." doesn't correspond to any existing path — likely a different shape`),
          { structuralMismatch: true },
        )
      }
    }
  }

  const assigned = new Map()
  const driftNotes = []

  /** Pair one hand element to one upstream element: validate tag
   * compatibility, record drift for path-type elements, and assign the
   * upstream body to the hand partKey — with the same dedupe rule as
   * before for templates that reuse a partKey across siblings (wind). */
  const pair = (h, u, posLabel) => {
    if (!tagsCompatible(h.tag, u.tag)) {
      throw Object.assign(
        new Error(`tag mismatch at ${posLabel}: existing=<motion.${h.tag}> upstream=<motion.${u.tag}>`),
        { structuralMismatch: true },
      )
    }
    if (h.tag === 'path' && h.d && u.d && !dPrefixMatches(h.d, u.d)) {
      driftNotes.push({ partKey: h.partKey, existingD: h.d.slice(0, 60), upstreamD: u.d.slice(0, 60) })
    }
    const newBody = up.partBodies.get(u.partName)
    if (assigned.has(h.partKey)) {
      if (assigned.get(h.partKey) !== newBody) {
        throw Object.assign(
          new Error(`partKey '${h.partKey}' reused at ${posLabel} but upstream body differs`),
          { structuralMismatch: true },
        )
      }
      return
    }
    assigned.set(h.partKey, newBody)
  }

  for (let i = 0; i < upSplit.containers.length; i++) {
    pair(handSplit.containers[i], upSplit.containers[i], `container[${i}]`)
  }
  for (let i = 0; i < upSplit.paths.length; i++) {
    pair(handSplit.paths[i], upSplit.paths[i], `path[${i}]`)
  }
  // Unpaired hand parts (extra containers or extra paths) stay out of
  // `assigned` — the renderer below will emit them as `{}` fillers.

  // Render the new variant block. Emit each distinct partKey exactly once
  // (hand templates like wind bind `variants.path` on several elements —
  // the variant body is shared, so the object literal needs only one key).
  // Any key upstream doesn't animate gets an empty `{}` so getVariants still
  // finds a body.
  const seenKeys = new Set()
  const lines = []
  for (const h of hand.handParts) {
    if (seenKeys.has(h.partKey)) continue
    seenKeys.add(h.partKey)
    const body = assigned.get(h.partKey)
    lines.push(body
      ? `    ${h.partKey}: {${body.trimEnd()}\n    },`
      : `    ${h.partKey}: {},`)
  }
  const variantBlock = `'${variantName}': {
${lines.join('\n')}
  } satisfies Record<string, Variants>,`

  if (mode === 'print') {
    console.log(`\n# Paste inside \`const animations = { ... }\` in ${hand.path.replace(ROOT + '/', '')}:\n`)
    console.log('  ' + variantBlock)
    console.log(`\n# Append to the '${kebab}' row's animations array in src/icons-meta.ts:\n`)
    console.log(`    { name: '${variantName}', source: 'lucide-animated' }`)
    console.log()
    return { driftNotes }
  }

  // Write-in-place: splice into the SFC and idempotently append the meta row.
  const newSrc = spliceVariantIntoSfc(hand.src, variantBlock)
  writeFileSync(hand.path, newSrc)
  appendMetaAnim(kebab, { name: variantName, source: 'lucide-animated' })
  return { driftNotes }
}

/** Pick the lowest free `<base>-<n>` (n>=2) not already present in
 * `takenKebabs`. Used when an upstream icon's shape doesn't structurally
 * align with the existing SFC — we create a numbered sibling icon instead
 * of forcing an incompatible augment. */
function pickSiblingKebab(base, takenKebabs) {
  for (let n = 2; n < 100; n++) {
    const candidate = `${base}-${n}`
    if (!takenKebabs.has(candidate)) return candidate
  }
  throw new Error(`no free numbered-sibling slot under ${base}-2..99`)
}

// --- main ---
mkdirSync(OUT_DIR, { recursive: true })
ensureUpstream()

if (augment) {
  try {
    augmentOne(augment, augmentVariantName)
    process.exit(0)
  } catch (e) {
    console.error(`augment failed for '${augment}': ${e.message}`)
    process.exit(1)
  }
}

const dirs = readdirSync(join(UPSTREAM_DIR, 'icons'))
  .filter(f => f.endsWith('.tsx'))
  .map(f => f.replace(/\.tsx$/, ''))
  .filter(kebab => !onlySet || onlySet.has(kebab))
  .sort()
  .slice(0, limit)

/**
 * Dispatch one upstream icon: fresh port, augment onto an existing SFC, or
 * fall through to a numbered sibling when the structure doesn't align.
 *
 * Semantics:
 *   - No existing SFC → fresh port via portOne. The icon's row is created
 *     by updateMeta() at the end of the run.
 *   - Existing SFC is a prior pqoqubbw auto-port → skip; it's already the
 *     lucide-animated flavour.
 *   - Existing SFC is hand-written / hand-ported / animate-ui auto-port →
 *     try augment(mode='write'). On structural mismatch (element count or
 *     tag sequence diverges — see send's extra swoosh <motion.path>), fall
 *     through to writing `<base>-<n>.vue` as a fresh pqoqubbw port. The
 *     numbered sibling gets its own `lucide-animated` default-animation
 *     row in icons-meta; original icon is untouched.
 *
 * `takenKebabs` is mutated as we claim sibling slots, so the caller can
 * run processOne in a loop without pre-reserving anything.
 */
function processOne(upstreamKebab, { takenKebabs, upstreamToSiblings }) {
  const outPath = join(OUT_DIR, `${upstreamKebab}.vue`)
  if (!existsSync(outPath)) {
    const r = portOne(upstreamKebab)
    return { kind: 'fresh', row: r }
  }
  const existing = readFileSync(outPath, 'utf8')
  if (existing.includes('Auto-generated from pqoqubbw')) {
    return { kind: 'skipped-existing-pqoqubbw' }
  }
  try {
    const { driftNotes } = augmentOne(upstreamKebab, 'lucide-animated', { mode: 'write' })
    return { kind: 'augmented', driftNotes }
  } catch (e) {
    if (e.alreadyHasVariant) {
      // Self-heal: if the SFC has the variant but icons-meta.ts doesn't
      // list it (e.g. meta was reset out of sync with the SFC), re-add
      // the row. appendMetaAnim is idempotent.
      try { appendMetaAnim(upstreamKebab, { name: 'lucide-animated', source: 'lucide-animated' }) }
      catch {}
      return { kind: 'skipped-has-lucide' }
    }
    if (!e.structuralMismatch) throw e
    // Structural mismatch → write a numbered sibling. Idempotency: if a
    // sibling SFC for this upstream already exists (detected via the
    // `// Upstream source: X` header), don't write another one.
    const existingSiblings = upstreamToSiblings.get(upstreamKebab)
    if (existingSiblings && existingSiblings.size > 0) {
      return { kind: 'skipped-existing-sibling' }
    }
    const sibKebab = pickSiblingKebab(upstreamKebab, takenKebabs)
    takenKebabs.add(sibKebab)
    const r = portOne(upstreamKebab, sibKebab)
    // Record the new sibling so subsequent iterations in this run don't
    // re-pick a clashing slot.
    if (!upstreamToSiblings.has(upstreamKebab)) upstreamToSiblings.set(upstreamKebab, new Set())
    upstreamToSiblings.get(upstreamKebab).add(sibKebab)
    return { kind: 'sibling', row: r, reason: e.message }
  }
}

/** Scan OUT_DIR for pqoqubbw-sourced SFCs and extract their `// Upstream
 * source: <kebab>` header. Returns a map from upstream kebab to the set
 * of local kebabs that port it (usually one: the upstream-name-matching
 * SFC or a numbered sibling). Used to make sibling creation idempotent
 * across re-runs. */
function scanExistingSiblings() {
  const map = new Map()
  if (!existsSync(OUT_DIR)) return map
  for (const f of readdirSync(OUT_DIR)) {
    if (!f.endsWith('.vue')) continue
    const outKebab = f.replace(/\.vue$/, '')
    const head = readFileSync(join(OUT_DIR, f), 'utf8').slice(0, 500)
    if (!head.includes('Auto-generated from pqoqubbw')) continue
    const m = head.match(/\/\/ Upstream source:\s*([a-z0-9-]+)/)
    if (!m) continue
    const upstreamKebab = m[1]
    if (!map.has(upstreamKebab)) map.set(upstreamKebab, new Set())
    map.get(upstreamKebab).add(outKebab)
  }
  return map
}

const takenKebabs = new Set([
  ...dirs,
  ...readdirSync(OUT_DIR).filter(f => f.endsWith('.vue')).map(f => f.replace(/\.vue$/, '')),
])
const upstreamToSiblings = scanExistingSiblings()

const results = {
  written: 0,
  augmented: 0,
  sibling: 0,
  'skipped-existing-pqoqubbw': 0,
  'skipped-has-lucide': 0,
  'skipped-existing-sibling': 0,
  failed: [],
  drift: [],
  siblingReasons: [],
}
const freshRows = []
for (const kebab of dirs) {
  try {
    const r = processOne(kebab, { takenKebabs, upstreamToSiblings })
    if (r.kind === 'fresh') {
      results.written++
      freshRows.push(r.row)
    } else if (r.kind === 'augmented') {
      results.augmented++
      if (r.driftNotes?.length) {
        for (const d of r.driftNotes) results.drift.push({ kebab, ...d })
      }
    } else if (r.kind === 'sibling') {
      results.sibling++
      freshRows.push(r.row)
      results.siblingReasons.push({ from: kebab, to: r.row.kebab, reason: r.reason })
    } else {
      results[r.kind] = (results[r.kind] || 0) + 1
    }
  } catch (e) {
    results.failed.push({ kebab, reason: e.message })
  }
}

if (freshRows.length) updateMeta(freshRows)
// Regenerate the barrel unconditionally — augments don't change the file
// list, but siblings do, and a no-op regenerate is cheap.
regenerateIndex()

console.log(`
Scanned ${dirs.length} upstream icons:
  written (fresh):        ${results.written}
  augmented (variant):    ${results.augmented}
  sibling (numbered):     ${results.sibling}
  skipped existing pqoq:  ${results['skipped-existing-pqoqubbw']}
  skipped has lucide:     ${results['skipped-has-lucide']}
  skipped sibling exists: ${results['skipped-existing-sibling']}
  failed:                 ${results.failed.length}
`)

if (results.siblingReasons.length) {
  console.log('Numbered siblings written (structural mismatch):')
  for (const s of results.siblingReasons) {
    console.log(`  ${s.from} → ${s.to}  (${s.reason})`)
  }
  console.log()
}

if (results.drift.length) {
  console.log(`Geometry-drift notices (${results.drift.length}) — augmented, but upstream's \`d\` differs from existing; eyeball the result:`)
  for (const d of results.drift) {
    console.log(`  ${d.kebab}.${d.partKey}`)
    console.log(`      existing: ${d.existingD}`)
    console.log(`      upstream: ${d.upstreamD}`)
  }
  console.log()
}

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
    console.log(`  ${reason} (${names.length}):  ${names.join(', ')}`)
  }
}
