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
 *
 * Also renames `translateX:` / `translateY:` → `x:` / `y:` regardless of
 * depth. motion-v Vue resolves `x`/`y` motion props to a CSS transform
 * translate (verified empirically: a `<motion.rect x="8" y="8">` with
 * variant `{ x: 0, y: 0 }` renders with `transform: none`, the rect at
 * its declared 8/8 position). The same rect with variant `{ translateX:
 * 0, translateY: 0 }` renders with `transform: matrix(1,0,0,1,8,8)` —
 * the rect's SVG x/y leak into the transform translation, doubling the
 * offset and pushing the rect off-canvas (Copy's blocks-too-far-apart
 * regression). pqoqubbw upstream uses `translateX`/`Y` because in
 * motion/react those map to plain CSS transform deltas; our motion-v
 * adapter normalises them to the equivalent that works on SVG primitives.
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
    // Rename translateX / translateY → x / y at any depth. The match must
    // anchor on a token boundary so we don't rewrite a property called
    // `myTranslateX` (none in upstream, but safer to be precise).
    const tm = body.slice(i).match(/^translateX(\s*):/) || body.slice(i).match(/^translateY(\s*):/)
    if (tm && (i === 0 || /[\s,{]/.test(body[i - 1]))) {
      const axis = tm[0].startsWith('translateX') ? 'x' : 'y'
      out += `${axis}${tm[1]}:`
      i += tm[0].length
      continue
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
  const marker = '<motion.svg\n    v-else\n    overflow="visible"\n    style="user-select: none; -webkit-user-select: none"'
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
/**
 * Render an upstream pqoqubbw icon to its Vue SFC text — no file write, no
 * existence checks, just the transform pipeline. Lifted out of `portOne` so
 * the multi-variant merge path can consume the rendered SFC directly without
 * touching the filesystem (`portOne` skips on existing files; the merger
 * needs to render fresh every time).
 */
function buildPqoqubbwSfc(upstreamKebab, outKebab = upstreamKebab) {
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
  return { kebab, pascal, sfc }
}

/**
 * Port a single upstream pqoqubbw icon: render via `buildPqoqubbwSfc` and
 * write to disk, honouring skip-hand / skip-exists guards.
 */
function portOne(upstreamKebab, outKebab = upstreamKebab) {
  const { kebab, pascal, sfc } = buildPqoqubbwSfc(upstreamKebab, outKebab)
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
    // v-for + custom: pqoqubbw's dashed/chart icons render N paths via
    // `[...].map((d, index) => <motion.path custom={index + 1} variants={SHARED}>)`.
    // After rewriteReactMapLoops, that collapses to ONE motion.path with
    // `v-for="(d, index) in VFOR_LIST_<n>"` and a function-form variant
    // body like `animate: (i: number) => ({ delay: i * 0.1 })`. Augment
    // splices a single `pathN` slot into the existing hand template, which
    // has no v-for (each path is its own element) and no way to forward
    // `:custom`. Capture the loop's index var + `custom={...}` expression
    // so augmentOne can fan one upstream body across N hand paths and
    // pre-invoke the function with each path's `i` value.
    const vforAttr = attrs.match(
      /v-for="(?:\(\s*[A-Za-z_$][\w$]*\s*,\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s+in\s+/,
    )
    const customAttr = attrs.match(/\bcustom=\{([^{}]+)\}/)
    orderedParts.push({
      tag,
      partName,
      d: dMatch ? dMatch[1].trim() : null,
      vforIndexVar: vforAttr ? (vforAttr[1] || null) : null,
      customExpr: customAttr ? customAttr[1].trim() : null,
    })
  }

  return { orderedParts, partBodies }
}

/**
 * Wrap a variants body's `animate: (PARAMS) => (BODY)` arrow function in an
 * IIFE that immediately invokes itself with `customValue`, turning a
 * dynamic-by-`custom`-prop variant into a static one. Used by augmentOne
 * when a single upstream `.map()`-collapsed path has to fan across N hand
 * paths that share no v-for binding (so `custom` can't be propagated at
 * runtime). The hand template's existing `:variants="variants.pathN"`
 * bindings stay untouched — each pathN now points at a pre-invoked,
 * static variant instead of a function expecting a custom value that
 * never arrives.
 *
 * Returns `body` unchanged if it doesn't contain a dynamic `animate:` —
 * caller is responsible for only invoking when isDynamic is true.
 */
function iifeAnimateForCustom(body, customValue) {
  const animMatch = body.match(/\banimate\s*:\s*(?=\()/)
  if (!animMatch) return body
  const paramsStart = body.indexOf('(', animMatch.index + animMatch[0].length)
  if (paramsStart < 0) return body
  let paramsEnd
  try { ({ end: paramsEnd } = extractBalanced(body, paramsStart, '(', ')')) }
  catch { return body }
  const after = body.slice(paramsEnd)
  const arrowMatch = after.match(/^\s*=>\s*\(/)
  if (!arrowMatch) return body
  const exprBodyStart = paramsEnd + arrowMatch[0].length - 1
  let exprBodyEnd
  try { ({ end: exprBodyEnd } = extractBalanced(body, exprBodyStart, '(', ')')) }
  catch { return body }
  const arrowFn = body.slice(paramsStart, exprBodyEnd)
  return body.slice(0, paramsStart) + `(${arrowFn})(${customValue})` + body.slice(exprBodyEnd)
}

/** Evaluate the upstream `custom={...}` expression for hand-path index `j`.
 * `index + 1` → j+1, `index` → j, `1` → 1. Falls back to `j + 1` if the
 * expression can't be parsed (sensible default for the dashed family). */
function evalCustomExprForIndex(customExpr, indexVar, j) {
  if (!customExpr) return j + 1
  try {
    if (indexVar) {
      return Function(indexVar, `"use strict"; return (${customExpr})`)(j)
    }
    return Function(`"use strict"; return (${customExpr})`)()
  } catch {
    return j + 1
  }
}

/** Bake an upstream variant body for a hand path. If the body is static,
 * returns it unchanged. If it's dynamic (`animate: (i) => (...)`), wraps
 * the arrow in an IIFE that pre-invokes it with the per-path custom value
 * — using the upstream element's `custom={...}` expression evaluated at
 * `j` (or its v-for index if collapsed from a `.map()`). Hand templates
 * have no v-for to forward `:custom` per element, so we have to bake the
 * variant statically. */
function bakeBodyForHand(upPart, body, j) {
  if (!body) return body
  if (!/\banimate\s*:\s*\([^)]*\)\s*=>\s*\(/.test(body)) return body
  const customValue = evalCustomExprForIndex(upPart.customExpr, upPart.vforIndexVar, j)
  return iifeAnimateForCustom(body, customValue)
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

  // Earlier versions threw a hard "structural mismatch" when upstream
  // paths' d-prefixes didn't all match a hand path — protecting against
  // shape mismatches like send's swoosh-vs-body. Pairing now does
  // progressive relaxation (12/5/3/2-char prefixes) followed by skip-
  // first positional, so the strict gate is gone. The remaining
  // protection: send-style icons have already been converted to
  // multi-variant SFCs, and `processOne` skips them via the
  // `MultiVariantIcon` early return before augmentOne is even called.

  const assigned = new Map()
  const driftNotes = []

  /** Pair one hand element to one upstream element: validate tag
   * compatibility, record drift for path-type elements, and assign the
   * upstream body to the hand partKey — with the same dedupe rule as
   * before for templates that reuse a partKey across siblings (wind).
   * Dynamic upstream bodies (`animate: (i) => (...)`) are baked through
   * an IIFE using the upstream element's `custom={N}` literal — the hand
   * template has no v-for to forward `:custom` per element, so the
   * variant has to be static. `j` is the hand-path index, used as the
   * fallback `i` value when upstream's `custom` expr isn't a literal. */
  const pair = (h, u, posLabel, j = 0) => {
    if (!tagsCompatible(h.tag, u.tag)) {
      throw Object.assign(
        new Error(`tag mismatch at ${posLabel}: existing=<motion.${h.tag}> upstream=<motion.${u.tag}>`),
        { structuralMismatch: true },
      )
    }
    if (h.tag === 'path' && h.d && u.d && !dPrefixMatches(h.d, u.d)) {
      driftNotes.push({ partKey: h.partKey, existingD: h.d.slice(0, 60), upstreamD: u.d.slice(0, 60) })
    }
    const rawBody = up.partBodies.get(u.partName)
    const newBody = bakeBodyForHand(u, rawBody, j)
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

  // Fan case: pqoqubbw's `.map((d, index) => <motion.path custom={index+1}
  // variants={SHARED} />)` collapses to ONE upstream path with a v-for + a
  // dynamic `animate: (i) => ({ delay: i * 0.1 })` body. The hand template
  // has N separate `<motion.path :variants="variants.pathN" />` elements
  // and no v-for, so we can't propagate `:custom` per element. Pre-invoke
  // the function with each path's `i` value via IIFE so every hand pathN
  // ends up with a static, baked-in variant body.
  const onlyUp = upSplit.paths.length === 1 ? upSplit.paths[0] : null
  const onlyUpBody = onlyUp ? up.partBodies.get(onlyUp.partName) : null
  const onlyUpDynamic = onlyUpBody && /\banimate\s*:\s*\([^)]*\)\s*=>\s*\(/.test(onlyUpBody)
  const isFanCase = onlyUp && onlyUpDynamic && handSplit.paths.length > 1
  if (isFanCase) {
    for (let j = 0; j < handSplit.paths.length; j++) {
      pair(handSplit.paths[j], onlyUp, `fan path[${j}]`, j)
    }
  } else {
    // d-based pairing: when both sides have literal `d` strings, try to
    // match upstream paths to hand paths by their d-prefix. Progressive
    // relaxation handles cosmetic drift (pqoqubbw's plus-icon stems sit
    // at y=8 vs animate-ui's y=7; users' arc-radius rounds 3.128 → 3.13
    // in newer pqoqubbw exports). Width 12 is strict, 5 catches single-
    // digit-coord drift, 3 catches first-coord drift but still relies on
    // distinct first-letter+digit groupings. If any width yields a unique
    // full mapping, use it. Otherwise fall back to skip-first positional
    // (upstream[j] → hand[offset + j], where offset closes the count gap)
    // — the convention is hand[0] is a "background" element pqoqubbw
    // renders as a static <path>, so dropping that index aligns the
    // animated paths. Equal-count cases use plain positional pairing.
    let dMap = null
    if (upSplit.paths.every(p => p.d) && handSplit.paths.every(p => p.d)) {
      for (const N of [12, 5, 3, 2]) {
        const norm = d => d.replace(/\s+/g, '').slice(0, N)
        const handByPrefix = new Map()
        let conflict = false
        for (let i = 0; i < handSplit.paths.length; i++) {
          const k = norm(handSplit.paths[i].d)
          if (handByPrefix.has(k)) { conflict = true; break }
          handByPrefix.set(k, i)
        }
        if (conflict) continue
        const candidate = new Map()
        let ok = true
        for (let j = 0; j < upSplit.paths.length; j++) {
          const k = norm(upSplit.paths[j].d)
          const handIdx = handByPrefix.get(k)
          if (handIdx === undefined) { ok = false; break }
          candidate.set(j, handIdx)
        }
        if (ok) { dMap = candidate; break }
      }
    }
    if (dMap) {
      for (const [upIdx, handIdx] of dMap.entries()) {
        pair(handSplit.paths[handIdx], upSplit.paths[upIdx], `path[d-match→${handIdx}]`, handIdx)
      }
    } else if (upSplit.paths.length < handSplit.paths.length) {
      const offset = handSplit.paths.length - upSplit.paths.length
      for (let j = 0; j < upSplit.paths.length; j++) {
        pair(handSplit.paths[offset + j], upSplit.paths[j], `path[skip-first→${offset + j}]`, offset + j)
      }
    } else {
      for (let i = 0; i < upSplit.paths.length; i++) {
        pair(handSplit.paths[i], upSplit.paths[i], `path[${i}]`, i)
      }
    }
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
 * `takenKebabs`. Used as a last-resort fallback when multi-variant merging
 * fails (parser couldn't extract one of the two SFCs cleanly). The default
 * structural-mismatch path is now `mergeAsMultiVariant` — siblings are only
 * written when that path itself errors. */
function pickSiblingKebab(base, takenKebabs) {
  for (let n = 2; n < 100; n++) {
    const candidate = `${base}-${n}`
    if (!takenKebabs.has(candidate)) return candidate
  }
  throw new Error(`no free numbered-sibling slot under ${base}-2..99`)
}

// =============================================================================
// Multi-variant merge: when the existing SFC and upstream pqoqubbw silhouettes
// diverge, fold them into a single `<MultiVariantIcon>`-backed SFC instead of
// shipping a numbered sibling. Public API stays identical — consumers write
// `<AudioLines animation="alt" />`, regardless of which generator path the
// SFC took at write time.
// =============================================================================

/**
 * Parse one of our generated Vue SFCs into the data shape `<MultiVariantIcon>`
 * consumes — element graph + per-key variant block. Two ingest paths use this:
 *   1. Existing animate-ui-sourced SFC at `src/icons/<kebab>.vue`.
 *   2. Pqoqubbw-rendered SFC text from `buildPqoqubbwSfc` (in-memory, no file).
 *
 * Limited to the regular SFC shape both port scripts emit — top-level leaf
 * elements inside `<motion.svg>`, no `<motion.g>` wrappers, no `v-for`, single
 * `default` animation in the `animations` block. If a source SFC violates any
 * of those, we throw and the caller falls back to a numbered sibling.
 *
 * Returns `{ elements, variantsSrc }`:
 *   - `elements`: ordered list of `{ tag, attrs, key? }` for every child of
 *     the outer `<motion.svg>`. `key` is set when the element binds to
 *     `:variants="variants.<key>"`; absent for static elements.
 *   - `variantsSrc`: literal JS source for the `default:`-block's body (the
 *     `{ <key>: { initial, animate }, ... }` object), spliced verbatim into
 *     the merged SFC so we don't have to re-stringify motion's variant DSL.
 */
function parseSfcToMultiVariantData(src) {
  // 1. Locate `const animations = { ... }` and walk every top-level entry.
  // We capture each entry's name + value-expression so the merger can
  // preserve `blink`, `wink`, `pulse`, `default-loop`, etc. alongside
  // `default`. Hand-templated SFCs use one element graph for all variants;
  // only the per-variant `variants` block changes.
  const animMatch = src.match(/const\s+animations\b[^=]*=\s*\{/)
  if (!animMatch) throw new Error('no `const animations` block')
  const animBraceIdx = animMatch.index + animMatch[0].length - 1
  const { block: animBlock } = extractBalanced(src, animBraceIdx)
  const animations = walkAnimationsBlock(animBlock)
  if (animations.length === 0) {
    throw new Error('no animation entries found in animations block')
  }

  // 2. Walk children of the outer `<motion.svg>`.
  const svgMatch = src.match(/<motion\.svg\b([^>]*)>([\s\S]*?)<\/motion\.svg>/)
  if (!svgMatch) throw new Error('no `<motion.svg>` block in template')
  const rootAttrsSrc = svgMatch[1]
  const childrenSrc = svgMatch[2]

  let elements = parseTemplateChildren(childrenSrc)
  if (elements.length === 0) {
    throw new Error('no elements found in template')
  }

  // pqoqubbw's standard shape binds `:variants="variants.<key>"` directly on
  // the outer `<motion.svg>` so the whole SVG (and every child via motion-v
  // variant propagation) animates as one. `<MultiVariantIcon>`'s own root
  // `<motion.svg>` is fixed (it doesn't take a variants prop), so we hoist
  // the binding into a synthetic `<g>` wrapper around the children and
  // route the variant key onto that group. Visually equivalent — `<g>` is
  // invisible — and motion-v propagates from the keyed `<motion.g>` to its
  // descendants identically.
  const rootKeyMatch =
    rootAttrsSrc.match(/:variants="variants\.([A-Za-z_][\w]*)"/) ||
    rootAttrsSrc.match(/:variants="variants\[(?:'([^']+)'|"([^"]+)")\]"/)
  if (rootKeyMatch) {
    const rootKey = rootKeyMatch[1] || rootKeyMatch[2]
    elements = [{ tag: 'g', attrs: {}, key: rootKey, children: elements }]
  }

  return { elements, animations }
}

/**
 * Given the outer `{ ... }` block of `const animations = { ... }`, return
 * an ordered list of `{ name, variantsSrc }` for every top-level entry.
 *
 * Names can be unquoted identifiers (`default`, `blink`) or quoted strings
 * (`'default-loop'`, `'lucide-animated'`). Values can be plain object
 * literals, IIFEs (`(() => { … })()` — cast / sun), or any expression
 * terminated by a top-level `,` or `}`. A trailing ` satisfies <Type>` is
 * stripped from each value before the renderer re-attaches an
 * `as Record<string, Variants>` cast.
 */
function walkAnimationsBlock(animBlock) {
  const out = []
  // Skip outer `{` and trailing `}`.
  let i = 1
  let depth = 0
  let inStr = null
  while (i < animBlock.length - 1) {
    const c = animBlock[i]
    if (inStr) {
      if (c === '\\') { i += 2; continue }
      if (c === inStr) inStr = null
      i++; continue
    }
    if (c === '"' || c === "'") { inStr = c; i++; continue }
    if (c === '{' || c === '(' || c === '[') { depth++; i++; continue }
    if (c === '}' || c === ')' || c === ']') { depth--; i++; continue }
    if (depth !== 0) { i++; continue }
    // At depth 0 inside the outer braces. Try to match a `<name>:` opener.
    const keyMatch = animBlock.slice(i).match(
      /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:\s*/,
    )
    if (!keyMatch) { i++; continue }
    const name = keyMatch[1] || keyMatch[2] || keyMatch[3]
    const valueStart = i + keyMatch[0].length

    // Walk forward from `valueStart` to the next top-level `,` or `}`.
    let j = valueStart
    let vDepth = 0
    let vStr = null
    while (j < animBlock.length) {
      const cc = animBlock[j]
      if (vStr) {
        if (cc === '\\') { j += 2; continue }
        if (cc === vStr) vStr = null
        j++; continue
      }
      if (cc === '"' || cc === "'") { vStr = cc; j++; continue }
      if (cc === '{' || cc === '(' || cc === '[') { vDepth++; j++; continue }
      if (cc === '}' || cc === ')' || cc === ']') {
        if (vDepth === 0) break // outer animations-block close
        vDepth--; j++; continue
      }
      if (vDepth === 0 && cc === ',') break
      j++
    }
    let variantsSrc = animBlock.slice(valueStart, j).trim()
    variantsSrc = variantsSrc.replace(/\s+satisfies\s+[^,]+$/s, '').trim()
    out.push({ name, variantsSrc })
    i = j + 1 // skip past the `,` (or stop if we hit the closing `}`)
  }
  return out
}

/**
 * Recursively parse a template fragment into an `SvgElement[]`. Handles two
 * shapes that our generators emit:
 *   - **Self-closing leaves**: `<motion.path ... />`, `<path ... />`,
 *     `<circle ... />`, etc. Most of the icons we ship.
 *   - **Group wrappers**: `<motion.g ...>...</motion.g>`, `<g ...>...</g>`.
 *     Used by animate-ui icons that drive a single variant transform on a
 *     whole sub-tree (e.g. `send`'s plane-takeoff group). The wrapper's
 *     attrs/key are captured on the parent; inner content recurses.
 *
 * Walks character by character so nested same-tag wrappers (`<g><g>...</g></g>`,
 * not currently emitted but cheap to support) don't trip a regex backref.
 */
function parseTemplateChildren(src) {
  const out = []
  let i = 0
  while (i < src.length) {
    if (src[i] !== '<') { i++; continue }
    // Comments + close-tag fragments are not children — skip them.
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i)
      i = end < 0 ? src.length : end + 3
      continue
    }
    if (src[i + 1] === '/') {
      // Stray close tag at top level (shouldn't happen in well-formed input).
      i = src.indexOf('>', i)
      if (i < 0) break
      i++
      continue
    }
    // Match an opening tag header up to its `>`.
    const headerRe = /^<(motion\.[a-zA-Z]+|[a-zA-Z][\w]*)\b([\s\S]*?)(\/?)>/
    const m = src.slice(i).match(headerRe)
    if (!m) { i++; continue }
    const fullTag = m[1]
    const attrsSrc = m[2]
    const isSelfClosing = m[3] === '/'
    const tag = fullTag.startsWith('motion.') ? fullTag.slice('motion.'.length) : fullTag
    if (tag === 'svg') {
      // Outer was already stripped by the caller — defensive skip.
      i += m[0].length
      continue
    }
    const { attrs, partKey } = parseLeafAttrs(attrsSrc)
    const el = { tag, attrs }
    if (partKey) el.key = partKey

    if (isSelfClosing) {
      out.push(el)
      i += m[0].length
      continue
    }

    // Open tag: find its matching close, accounting for nested same-name opens.
    const innerStart = i + m[0].length
    const closeNeedle = `</${fullTag}>`
    const openNeedlePrefix = `<${fullTag}`
    let depth = 1
    let scan = innerStart
    let closeIdx = -1
    while (scan < src.length) {
      const nextClose = src.indexOf(closeNeedle, scan)
      if (nextClose < 0) break
      // Look for any nested same-name open between scan and nextClose.
      let nestedOpenIdx = -1
      let probe = scan
      while (probe < nextClose) {
        const candidate = src.indexOf(openNeedlePrefix, probe)
        if (candidate < 0 || candidate >= nextClose) break
        // Only count it as a nested open if the tag-name boundary is real
        // (next char is whitespace, `>` or `/`). Otherwise it's a name-prefix
        // collision (e.g. `<g>` matching `<g.foo>` — won't happen here, but
        // guarded for safety).
        const after = src[candidate + openNeedlePrefix.length]
        if (/[\s/>]/.test(after)) { nestedOpenIdx = candidate; break }
        probe = candidate + openNeedlePrefix.length
      }
      if (nestedOpenIdx >= 0) {
        depth++
        // Advance past the nested open's `>` (self-closing or not).
        const gtIdx = src.indexOf('>', nestedOpenIdx)
        if (gtIdx < 0) break
        const isNestedSelfClose = src[gtIdx - 1] === '/'
        scan = gtIdx + 1
        if (isNestedSelfClose) depth--
        continue
      }
      // No nested open before this close → this close matches us.
      depth--
      if (depth === 0) { closeIdx = nextClose; break }
      scan = nextClose + closeNeedle.length
    }
    if (closeIdx < 0) {
      throw new Error(`unmatched open <${fullTag}> — template not well-formed`)
    }
    const innerSrc = src.slice(innerStart, closeIdx)
    const children = parseTemplateChildren(innerSrc)
    if (children.length > 0) el.children = children
    out.push(el)
    i = closeIdx + closeNeedle.length
  }
  return out
}

/**
 * Pull shape attrs and the `:variants="variants.<key>"` binding off a single
 * leaf element's attribute string. Skips all motion/framework bindings
 * (`:animate`, `initial`, `@animationComplete`, sizing/styling props that
 * `<MultiVariantIcon>` re-applies on its own root).
 */
function parseLeafAttrs(attrsSrc) {
  const attrs = {}
  let partKey = null

  // :variants="variants.foo" or :variants="variants['aux:drop1']"
  const dotMatch = attrsSrc.match(/:variants="variants\.([A-Za-z_][\w]*)"/)
  const brkMatch = attrsSrc.match(/:variants="variants\[(?:'([^']+)'|"([^"]+)")\]"/)
  if (dotMatch) partKey = dotMatch[1]
  else if (brkMatch) partKey = brkMatch[1] || brkMatch[2]

  // Skip motion-v framework bindings only. Everything else is a real SVG
  // attribute and must reach `<MultiVariantIcon>`'s child render — including
  // geometry like `width`/`height` on `<rect>`, `cx`/`cy`/`r` on `<circle>`,
  // and per-element overrides like `stroke-width="3"`. Earlier versions
  // skipped width/height/stroke-width here, which silently zeroed the
  // dimensions of every keyed `<rect>` (Bot's body rectangle was the visible
  // regression).
  const SKIP_BIND = new Set(['variants', 'animate'])

  // Numeric bound attrs: `:cx="6"`, `:r="2.5"`, `:y1="-3"`. Run before the
  // generic string pass so we don't capture them as strings.
  const numAttrRe = /(?:^|\s):([a-zA-Z][a-zA-Z0-9-]*)="(-?\d+(?:\.\d+)?)"/g
  let m
  while ((m = numAttrRe.exec(attrsSrc)) !== null) {
    const k = m[1]
    if (SKIP_BIND.has(k)) continue
    attrs[k] = Number(m[2])
  }

  // Static string attrs: `d="M..."`, `points="0,0 1,1"`. Only the few
  // root-svg-only attrs and motion-v's `initial="initial"` get skipped.
  // Everything else (per-element fill/stroke overrides, stroke-dasharray,
  // transform, etc.) is preserved verbatim so the merged icon renders the
  // same as the source.
  const SKIP_STATIC = new Set(['initial', 'xmlns', 'viewBox', 'overflow'])
  const stringAttrRe = /(?:^|\s)([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/g
  while ((m = stringAttrRe.exec(attrsSrc)) !== null) {
    const k = m[1]
    if (SKIP_STATIC.has(k)) continue
    if (k.startsWith(':') || k.startsWith('@')) continue
    if (k in attrs) continue // already captured numerically
    attrs[k] = m[2]
  }

  return { attrs, partKey }
}

/**
 * Render a multi-variant SFC that delegates to `<MultiVariantIcon>`. The two
 * data sides go in verbatim — `defaultData.variantsSrc` and
 * `altData.variantsSrc` are JS object literals (as strings) we splice into
 * the output, so motion-v's `Variants` DSL (Infinity, eased keyframes, etc.)
 * survives the round trip unchanged.
 */
function renderMultiVariantSfc({ pascal, baseData, altData, altName = 'alt' }) {
  // Sanity: alt SFC always has just one entry called `default` (pqoqubbw
  // ports never emit named variants beyond `default`). Pull that one out
  // and rename it to `altName` ('alt' by default) on the way into the
  // merged SFC so consumers write `<Foo animation="alt" />`.
  const altEntry =
    altData.animations.find(a => a.name === 'default') ?? altData.animations[0]
  if (!altEntry) throw new Error('alt SFC has no animations')

  // Refuse merge if the base already has a variant named `altName` —
  // overwriting it silently would lose user-facing surface. Caller can
  // pass a different `altName` to disambiguate.
  if (baseData.animations.some(a => a.name === altName)) {
    throw new Error(`base SFC already has a '${altName}' variant — pick a different alt name`)
  }

  const elementsLiteralBase = formatElementArrayLiteral(baseData.elements, 6)
  const elementsLiteralAlt = formatElementArrayLiteral(altData.elements, 6)
  const animationBlocks = []
  for (const { name, variantsSrc } of baseData.animations) {
    animationBlocks.push(
      `  ${jsKey(name)}: {\n` +
      `    elements: ${elementsLiteralBase},\n` +
      `    variants: ${variantsSrc} as Record<string, Variants>,\n` +
      `  },`,
    )
  }
  animationBlocks.push(
    `  ${jsKey(altName)}: {\n` +
    `    elements: ${elementsLiteralAlt},\n` +
    `    variants: ${altEntry.variantsSrc} as Record<string, Variants>,\n` +
    `  },`,
  )

  return `<script setup lang="ts">
// Multi-variant icon. The original animate-ui / hand-written silhouette ships
// as \`default\` (plus any extra named animations the base SFC carried —
// \`blink\`, \`wink\`, \`pulse\`, etc.); the pqoqubbw/lucide-animated silhouette
// ships as \`alt\`. Element graphs differ across variants, so we delegate to
// \`<MultiVariantIcon>\` rather than the standard hand-templated layout.
//
// Generated by scripts/port-pqoqubbw-icons.mjs (multi-variant merge path).
// Hand-edits survive port reruns — the script preserves SFCs that already
// host an \`alt\` variant via this path.
import { computed } from 'vue'
import type { Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'
import MultiVariantIcon from '../core/MultiVariantIcon.vue'
import { hasOwnTriggers, type IconTriggerProps } from '../core/context'
import type { MultiVariantAnimations } from '../core/element-types'

const props = withDefaults(
  defineProps<IconTriggerProps & { strokeWidth?: number }>(),
  { size: 28, strokeWidth: 2 },
)

const animations: MultiVariantAnimations = {
${animationBlocks.join('\n')}
}

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

  <MultiVariantIcon
    v-else
    :animations="animations"
    :size="props.size"
    :strokeWidth="props.strokeWidth"
  />
</template>
`
}

function formatAttrsLiteral(attrs) {
  const entries = Object.entries(attrs).map(([k, v]) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
    const val = typeof v === 'number' ? String(v) : JSON.stringify(v)
    return `${key}: ${val}`
  })
  if (entries.length === 0) return '{}'
  return `{ ${entries.join(', ')} }`
}

/**
 * Render a JS object key. Bare identifier when valid (`default`, `pulse`),
 * single-quoted string otherwise (`'default-loop'`, `'lucide-animated'`).
 */
function jsKey(name) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
    ? name
    : `'${name.replace(/'/g, "\\'")}'`
}

/**
 * Render `SvgElement[]` as a JS array literal that fits inside the generated
 * `MultiVariantAnimations` block. `indent` is the number of spaces of the
 * outermost line (top-level call uses 6 to match the renderer template).
 *
 * Children render recursively as nested array literals so wrapper elements
 * (`tag: 'g'`) come out as
 *
 *   { tag: 'g', attrs: {}, key: 'group', children: [
 *     { tag: 'path', attrs: { d: '...' }, key: 'body' },
 *   ] },
 */
function formatElementArrayLiteral(elements, indent) {
  const inner = ' '.repeat(indent)
  const open = ' '.repeat(Math.max(0, indent - 2))
  const lines = elements.map(el => formatElementLiteral(el, indent))
  return `[\n${lines.join('\n')}\n${open}]`
  void inner
}

function formatElementLiteral(el, indent) {
  const pad = ' '.repeat(indent)
  const parts = [`tag: ${JSON.stringify(el.tag)}`]
  parts.push(`attrs: ${formatAttrsLiteral(el.attrs)}`)
  if (el.key) parts.push(`key: ${JSON.stringify(el.key)}`)
  if (el.paths && el.paths.length) {
    const pathLits = el.paths.map(p => JSON.stringify(p)).join(', ')
    parts.push(`paths: [${pathLits}]`)
  }
  if (el.children && el.children.length) {
    const childLines = el.children.map(c => formatElementLiteral(c, indent + 2))
    parts.push(`children: [\n${childLines.join('\n')}\n${pad}]`)
  }
  return `${pad}{ ${parts.join(', ')} },`
}

/**
 * Pre-merge expansion: pqoqubbw renders staggered animations as
 *   `[paths].map((d, index) => <motion.path custom={index+1} variants={SHARED} d={d} />)`
 * which our upstream port preserves as a Vue v-for + a function-form
 * variant body. Vue + motion-v honour this for fresh-port SFCs (the
 * v-for iterates and `:custom` propagates per element). The merger
 * encodes element graphs as plain `SvgElement[]` for `<MultiVariantIcon>`,
 * which spreads `attrs` via `v-bind` — `v-for` is *not* a Vue directive
 * in that mode, just a literal attribute name. The merged icon's alt
 * variant would otherwise render a single empty `<path>` with no
 * animation (sun, sun-medium were the visible regressions).
 *
 * Expand v-for'd elements in the upstream SFC text *before* the merger
 * parses it: resolve the `VFOR_LIST_<n>` array, generate N concrete
 * `<motion.path>` elements with literal attrs, mint per-iteration variant
 * keys (`<key>1`, `<key>2`, ...), bake each function-form variant via
 * IIFE on the per-iteration `custom` value, and strip the VFOR_LIST
 * declarations. The result parses cleanly through the existing
 * `parseSfcToMultiVariantData` with no special v-for awareness needed.
 */
function expandVforForMerge(sfcText) {
  const lists = {}
  const listDecls = []
  const listHeaderRe = /const\s+(VFOR_LIST_\d+)\s*=\s*\[/g
  let lh
  while ((lh = listHeaderRe.exec(sfcText)) !== null) {
    const arrOpen = lh.index + lh[0].length - 1
    let arrEnd
    try { ({ end: arrEnd } = extractBalanced(sfcText, arrOpen, '[', ']')) }
    catch { continue }
    const arrSrc = sfcText.slice(arrOpen, arrEnd)
    let value
    try { value = Function(`"use strict"; return (${arrSrc});`)() }
    catch { continue }
    if (!Array.isArray(value)) continue
    lists[lh[1]] = value
    // Eat trailing `;` and a single newline so the strip below leaves no
    // dangling blank line where the const used to live.
    let declEnd = arrEnd
    if (sfcText[declEnd] === ';') declEnd++
    if (sfcText[declEnd] === '\n') declEnd++
    listDecls.push({ start: lh.index, end: declEnd, name: lh[1] })
  }
  if (listDecls.length === 0) return sfcText

  const elementExpansions = []
  const variantExpansions = {}

  const elemRe = /<motion\.([a-z]+)\b([^>]*?)\/>/g
  let em
  while ((em = elemRe.exec(sfcText)) !== null) {
    const tag = em[1]
    const attrs = em[2]
    const vfor = attrs.match(
      /\bv-for="(?:\(\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s+in\s+(VFOR_LIST_\d+)"/,
    )
    if (!vfor) continue
    const itemVar = vfor[1] || vfor[3]
    const indexVar = vfor[1] ? vfor[2] : null
    const list = lists[vfor[4]]
    if (!list) continue
    const customMatch = attrs.match(/:custom="([^"]+)"/)
    const customExpr = customMatch ? customMatch[1].trim() : null
    const variantsMatch = attrs.match(/:variants="variants\.([A-Za-z_][\w]*)"/)
    if (!variantsMatch) continue
    const partKey = variantsMatch[1]

    const lines = list.map((item, j) => {
      // Strip framework + iteration-only attrs. The merger rebuilds these
      // (`:animate`, `initial`, `@animationComplete`) inside MultiVariantElement.
      let perAttrs = attrs
        .replace(/\s+v-for="[^"]*"/, '')
        .replace(/\s+:key="[^"]*"/, '')
        .replace(/\s+:custom="[^"]*"/, '')
        .replace(/\s+@animationComplete="[^"]*"/, '')
        .replace(/\s+:animate="[^"]*"/, '')
      perAttrs = perAttrs.replace(/(\s+):([a-zA-Z][a-zA-Z0-9-]*)="([^"]+)"/g, (full, ws, name, expr) => {
        if (name === 'variants') return full
        try {
          const args = [itemVar]
          const vals = [item]
          if (indexVar) { args.push(indexVar); vals.push(j) }
          const value = Function(...args, `"use strict"; return (${expr});`)(...vals)
          if (typeof value === 'string') return `${ws}${name}="${value}"`
          if (typeof value === 'number') return `${ws}:${name}="${value}"`
          return full
        } catch {
          return full
        }
      })
      const newKey = `${partKey}${j + 1}`
      perAttrs = perAttrs.replace(
        new RegExp(`:variants="variants\\.${partKey}"`),
        `:variants="variants.${newKey}"`,
      )
      return `<motion.${tag}${perAttrs}/>`
    })
    elementExpansions.push({
      start: em.index,
      end: em.index + em[0].length,
      replacement: lines.join('\n      '),
    })
    variantExpansions[partKey] = list.map((_, j) => ({
      newKey: `${partKey}${j + 1}`,
      customValue: evalCustomExprForIndex(customExpr, indexVar, j),
    }))
  }

  if (elementExpansions.length === 0) return sfcText

  let out = sfcText
  // Element + list-decl removals applied right-to-left so earlier slice
  // offsets stay valid throughout.
  for (const ex of [...elementExpansions, ...listDecls].sort((a, b) => b.start - a.start)) {
    if (ex.replacement !== undefined) {
      out = out.slice(0, ex.start) + ex.replacement + out.slice(ex.end)
    } else {
      out = out.slice(0, ex.start) + out.slice(ex.end)
    }
  }

  for (const [partKey, expansions] of Object.entries(variantExpansions)) {
    out = expandVariantEntry(out, partKey, expansions)
  }

  return out
}

/** Expand a single `<partKey>: { ... }` entry inside the SFC's variants
 * block into N keyed entries (`<partKey>1`..`<partKey>N`), each carrying
 * the original body with its `animate: (i) => (...)` arrow baked through
 * an IIFE on the iteration's custom value. If the body isn't dynamic,
 * the bake passes through unchanged — the entry just gets duplicated
 * with renamed keys. */
function expandVariantEntry(sfcText, partKey, expansions) {
  const re = new RegExp(`(\\n[ \\t]*)${partKey}\\s*:\\s*\\{`)
  const m = sfcText.match(re)
  if (!m) return sfcText
  const indent = m[1]
  const braceIdx = m.index + m[0].length - 1
  let bodyEnd
  try { ({ end: bodyEnd } = extractBalanced(sfcText, braceIdx)) }
  catch { return sfcText }
  const bodySrc = sfcText.slice(braceIdx + 1, bodyEnd - 1)
  let after = bodyEnd
  if (sfcText[after] === ',') after++
  const newEntries = expansions.map(({ newKey, customValue }) => {
    const baked = iifeAnimateForCustom(bodySrc, customValue)
    return `${indent}${newKey}: {${baked}},`
  }).join('')
  return sfcText.slice(0, m.index) + newEntries + sfcText.slice(after)
}

/**
 * Replace the existing SFC at `src/icons/<upstreamKebab>.vue` with a
 * multi-variant SFC carrying both the existing silhouette (as `default`) and
 * the pqoqubbw upstream silhouette (as `alt`). Idempotent at the meta level —
 * `appendMetaAnim` skips if the row already has the variant. Throws if the
 * existing SFC is already multi-variant or if either parser bails.
 */
function mergeAsMultiVariant(upstreamKebab) {
  const existingPath = join(OUT_DIR, `${upstreamKebab}.vue`)
  if (!existsSync(existingPath)) {
    throw new Error('no existing SFC to merge with')
  }
  const existingSrc = readFileSync(existingPath, 'utf8')
  if (existingSrc.includes('MultiVariantIcon')) {
    throw new Error('existing SFC is already multi-variant — manual splice needed')
  }

  // Render upstream pqoqubbw to SFC text in memory (no file write).
  const built = buildPqoqubbwSfc(upstreamKebab)
  const baseData = parseSfcToMultiVariantData(existingSrc)
  const altData = parseSfcToMultiVariantData(expandVforForMerge(built.sfc))

  const merged = renderMultiVariantSfc({
    pascal: built.pascal,
    baseData,
    altData,
  })
  writeFileSync(existingPath, merged)

  // Append `alt: lucide-animated` to the icon's row in icons-meta.ts. The row
  // already exists (we required an existing SFC above), so this is just an
  // animation-list update. Existing base animations stay listed unchanged.
  appendMetaAnim(upstreamKebab, { name: 'alt', source: 'lucide-animated' })

  return { kebab: upstreamKebab, pascal: built.pascal, status: 'multi-variant' }
}

// Allow other modules to import this file (e.g. for smoke-testing
// `parseSfcToMultiVariantData` / `renderMultiVariantSfc`) without triggering
// the network-heavy upstream clone or the file-writing main loop.
export {
  parseSfcToMultiVariantData,
  renderMultiVariantSfc,
  mergeAsMultiVariant,
  buildPqoqubbwSfc,
  augmentOne,
  ensureUpstream,
  expandVforForMerge,
}
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) runMain()

function runMain() {
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
 * fold both silhouettes into a single multi-variant SFC when their element
 * graphs diverge.
 *
 * Semantics:
 *   - No existing SFC → fresh port via portOne. The icon's row is created
 *     by updateMeta() at the end of the run.
 *   - Existing SFC is a prior pqoqubbw auto-port → skip; it's already the
 *     lucide-animated flavour.
 *   - Existing SFC is a multi-variant SFC (already hosts `alt`) → skip;
 *     re-merging would re-derive the same data and is a no-op.
 *   - Existing SFC is hand-written / hand-ported / animate-ui auto-port →
 *     try augment(mode='write'). On structural mismatch (element count or
 *     tag sequence diverges — see send's extra swoosh <motion.path>), try
 *     `mergeAsMultiVariant`: convert the existing SFC into a multi-variant
 *     SFC carrying both silhouettes (`default` = existing, `alt` = upstream).
 *     If that path itself errors (parser couldn't read one of the two SFCs),
 *     fall through to a numbered `<base>-<n>` sibling — same as the old
 *     behaviour, kept as a safety net.
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
  if (existing.includes('MultiVariantIcon')) {
    // Already a multi-variant SFC carrying `default` + `alt` — no merge to do.
    // appendMetaAnim is idempotent so re-running can't double-list `alt`.
    try { appendMetaAnim(upstreamKebab, { name: 'alt', source: 'lucide-animated' }) }
    catch {}
    return { kind: 'skipped-existing-multivariant' }
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

    // Structural mismatch: prefer multi-variant merge over numbered sibling.
    // Merging keeps the public API single-component (`<Foo animation="alt"/>`)
    // and avoids the `<Foo2>` user-facing fork.
    try {
      const r = mergeAsMultiVariant(upstreamKebab)
      return { kind: 'multi-variant', row: r, reason: e.message }
    } catch (mergeErr) {
      // Multi-variant merge failed (parser couldn't handle one of the SFC
      // shapes — wrappers, unusual variants block, etc.). Fall back to the
      // legacy numbered-sibling path so the variant still ships, just under a
      // separate component.
      const existingSiblings = upstreamToSiblings.get(upstreamKebab)
      if (existingSiblings && existingSiblings.size > 0) {
        return { kind: 'skipped-existing-sibling' }
      }
      const sibKebab = pickSiblingKebab(upstreamKebab, takenKebabs)
      takenKebabs.add(sibKebab)
      const r = portOne(upstreamKebab, sibKebab)
      if (!upstreamToSiblings.has(upstreamKebab)) upstreamToSiblings.set(upstreamKebab, new Set())
      upstreamToSiblings.get(upstreamKebab).add(sibKebab)
      return {
        kind: 'sibling',
        row: r,
        reason: `multi-variant merge failed (${mergeErr.message}); upstream mismatch: ${e.message}`,
      }
    }
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
  'multi-variant': 0,
  sibling: 0,
  'skipped-existing-pqoqubbw': 0,
  'skipped-existing-multivariant': 0,
  'skipped-has-lucide': 0,
  'skipped-existing-sibling': 0,
  failed: [],
  drift: [],
  multiVariantReasons: [],
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
    } else if (r.kind === 'multi-variant') {
      results['multi-variant']++
      results.multiVariantReasons.push({ kebab: r.row.kebab, reason: r.reason })
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
  multi-variant (alt):    ${results['multi-variant']}
  sibling (numbered):     ${results.sibling}
  skipped existing pqoq:  ${results['skipped-existing-pqoqubbw']}
  skipped existing multi: ${results['skipped-existing-multivariant']}
  skipped has lucide:     ${results['skipped-has-lucide']}
  skipped sibling exists: ${results['skipped-existing-sibling']}
  failed:                 ${results.failed.length}
`)

if (results.multiVariantReasons.length) {
  console.log('Multi-variant merges (existing icon now hosts an `alt` silhouette):')
  for (const m of results.multiVariantReasons) {
    console.log(`  ${m.kebab}  (${m.reason})`)
  }
  console.log()
}

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
} // end runMain()
