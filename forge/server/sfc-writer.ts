/**
 * Convert a Forge `Proposal` into a Vue SFC matching the layout of
 * `src/icons/*.vue`, write it to `src/icons/<kebab>.vue`, and splice the
 * new icon into `src/icons-meta.ts` + `src/index.ts` in alphabetical
 * position.
 *
 * The SFC layout matches the existing port output (see `airplane.vue` /
 * `bell.vue`): selfWrap branch + static branch, `animations.default` block
 * passed through `getVariants()`, every animated element bound to
 * `:variants="variants.<key>"` and `:animate="current"`.
 *
 * Source attribution: `'hand-written'`. This is what `port-icons.mjs`
 * checks before deciding whether to overwrite — Forge-generated icons
 * survive a port re-run as long as they don't collide with an upstream
 * `animate-ui` icon of the same name.
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Proposal, SvgElement, VariantSet } from './schema'

const here = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(here, '../..')
const ICONS_DIR = join(REPO_ROOT, 'src/icons')
const ICONS_META_PATH = join(REPO_ROOT, 'src/icons-meta.ts')
const INDEX_PATH = join(REPO_ROOT, 'src/index.ts')

export interface WriteResult {
  filePath: string
  pascal: string
  kebab: string
  metaUpdated: boolean
  indexUpdated: boolean
}

export interface ExistingIconInfo {
  filePath: string
  variants: string[]
}

/**
 * Returns info about an existing icon, or `null` if it's a new one. We
 * check disk for the SFC file (the source of truth) and crib variant
 * names from `icons-meta.ts` for the conflict warning.
 */
export async function findExistingIcon(
  iconName: string,
): Promise<ExistingIconInfo | null> {
  const kebab = iconName.trim().toLowerCase()
  const filePath = join(ICONS_DIR, `${kebab}.vue`)
  try {
    await fs.access(filePath)
  } catch {
    return null
  }
  const meta = await fs.readFile(ICONS_META_PATH, 'utf8')
  const entryRe = new RegExp(
    `\\{\\s*kebab:\\s*'${escapeRe(kebab)}'[^}]*animations:\\s*\\[([^\\]]*)\\]`,
  )
  const m = meta.match(entryRe)
  const variants: string[] = []
  if (m) {
    const nameRe = /name:\s*'([^']+)'/g
    let nameMatch: RegExpExecArray | null
    while ((nameMatch = nameRe.exec(m[1])) !== null) {
      variants.push(nameMatch[1])
    }
  }
  return { filePath, variants }
}

export async function writeIconSfc(
  iconName: string,
  proposal: Proposal,
): Promise<WriteResult> {
  const kebab = iconName.trim().toLowerCase()
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(kebab)) {
    throw new Error(`Invalid kebab icon name: "${iconName}"`)
  }
  const pascal = kebabToPascal(kebab)

  const sfc = renderSfc(pascal, proposal)
  const filePath = join(ICONS_DIR, `${kebab}.vue`)
  await fs.writeFile(filePath, sfc, 'utf8')

  const metaUpdated = await insertIntoIconsMeta(kebab, pascal, ['default'])
  const indexUpdated = await insertIntoIndex(kebab, pascal)

  return { filePath, pascal, kebab, metaUpdated, indexUpdated }
}

/**
 * Check whether N proposals share an element graph and can therefore be
 * merged into a single multi-variant SFC. Compatible means: same length,
 * and for each element index — same `tag`, same `attrs.d` (or matching
 * static-shape attrs for non-path tags), same `paths` array (deep-equal).
 *
 * The element `key` and `variants` block are deliberately ignored — those
 * are what *vary* across animations. We're only verifying the rendered
 * silhouette will line up.
 */
export function areProposalsMergeCompatible(proposals: Proposal[]): boolean {
  if (proposals.length < 2) return true
  const ref = proposals[0]
  for (let p = 1; p < proposals.length; p++) {
    const other = proposals[p]
    if (other.elements.length !== ref.elements.length) return false
    for (let i = 0; i < ref.elements.length; i++) {
      const a = ref.elements[i]
      const b = other.elements[i]
      if (a.tag !== b.tag) return false
      if (!shapeAttrsMatch(a, b)) return false
      if (!arraysEqual(a.paths, b.paths)) return false
    }
  }
  return true
}

const SHAPE_ATTRS: Record<string, string[]> = {
  path: ['d'],
  line: ['x1', 'y1', 'x2', 'y2'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  polyline: ['points'],
  polygon: ['points'],
}

function shapeAttrsMatch(a: SvgElement, b: SvgElement): boolean {
  const keys = SHAPE_ATTRS[a.tag] ?? []
  for (const k of keys) {
    const av = a.attrs?.[k]
    const bv = b.attrs?.[k]
    if (av == null && bv == null) continue
    if (String(av ?? '') !== String(bv ?? '')) return false
  }
  return true
}

function arraysEqual(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * Write a multi-variant SFC where every variant shares the same element
 * graph (silhouette) but its own `variants` block (timings/keyframes/keys).
 *
 * Element keys can vary across proposals — we union them, with a stable
 * synthetic key (`el<index>` for any element that's animated in *any*
 * variant). Variant-specific keys map onto the synthetic key per variant.
 *
 * Caller passes proposals in pick order with explicit variant names. The
 * first entry's name should be `'default'` so the icon renders correctly
 * when consumers omit the `animation` prop.
 */
export interface NamedProposal {
  name: string
  proposal: Proposal
}

export async function writeMultiVariantSfc(
  iconName: string,
  named: NamedProposal[],
): Promise<WriteResult> {
  const kebab = iconName.trim().toLowerCase()
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(kebab)) {
    throw new Error(`Invalid kebab icon name: "${iconName}"`)
  }
  if (named.length < 2) {
    throw new Error('writeMultiVariantSfc requires ≥2 variants')
  }
  if (!areProposalsMergeCompatible(named.map(n => n.proposal))) {
    throw new Error('Proposals are not merge-compatible')
  }
  const pascal = kebabToPascal(kebab)

  const sfc = renderMultiVariantSfc(pascal, named)
  const filePath = join(ICONS_DIR, `${kebab}.vue`)
  await fs.writeFile(filePath, sfc, 'utf8')

  const metaUpdated = await insertIntoIconsMeta(
    kebab,
    pascal,
    named.map(n => n.name),
  )
  const indexUpdated = await insertIntoIndex(kebab, pascal)
  return { filePath, pascal, kebab, metaUpdated, indexUpdated }
}

function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .map(part => (part.length === 0 ? '' : part[0].toUpperCase() + part.slice(1)))
    .join('')
}

export function renderSfc(pascal: string, proposal: Proposal): string {
  const animationsBlock = renderAnimationsBlock(proposal.variants)
  // Number morph elements as we encounter them so the template can reference
  // each chain by a stable const name (`morphPaths0`, `morphPaths1`, …).
  let morphCount = 0
  const morphConsts: string[] = []
  const elementsMarkup = proposal.elements
    .map(el => renderElement(el, () => {
      const idx = morphCount++
      const name = `morphPaths${idx}`
      const literal = el.paths!.map(p => JSON.stringify(p)).join(',\n  ')
      morphConsts.push(`const ${name} = [\n  ${literal},\n]`)
      return name
    }))
    .join('\n')
  const usesMorph = morphCount > 0
  const morphImport = usesMorph
    ? `\nimport MorphPath from '../core/MorphPath.vue'`
    : ''
  const morphConstsBlock = usesMorph ? '\n' + morphConsts.join('\n') + '\n' : ''

  return `<script setup lang="ts">
// Auto-generated by Forge from a Claude proposal. Source: hand-written.
// Safe to hand-edit — port-icons.mjs only overwrites icons sourced from animate-ui.
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'${morphImport}
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
${morphConstsBlock}
const animations = {
  default: {
${animationsBlock}
  } satisfies Record<string, Variants>,
} satisfies Record<string, Record<string, Variants>>

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

  <motion.svg
    v-else
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
${elementsMarkup}
  </motion.svg>
</template>
`
}

/**
 * Render an SFC where the same element graph drives multiple animation
 * variants. The user picks the active animation via the `animation` prop;
 * `getVariants(animations, props.animation)` selects the right block at
 * runtime.
 *
 * Element keys can differ across proposals (the model assigns them freely),
 * so we mint a stable synthetic key per element index — `el0`, `el1`, … —
 * and remap each variant's variant-block to use those synthetic keys. The
 * generated template binds each animated element to `:variants="variants.elN"`,
 * which resolves to whichever shape the active animation provided.
 *
 * If a proposal doesn't animate a particular element index, that element
 * simply won't have an entry in that animation's variants block. The
 * template still renders it (statically) thanks to the `v-if` on the key
 * presence inside `renderElement`.
 */
function renderMultiVariantSfc(pascal: string, named: NamedProposal[]): string {
  const ref = named[0].proposal
  // Synthetic per-index keys so the template can bind by index regardless of
  // which keys each proposal happened to use.
  const synthKey = (i: number) => `el${i}`

  // Re-key each proposal's variants block onto synthetic indices.
  const remappedAnimations: Array<{ name: string; variants: Record<string, VariantSet> }> = []
  for (const { name, proposal } of named) {
    const remapped: Record<string, VariantSet> = {}
    proposal.elements.forEach((el, i) => {
      if (!el.key) return
      const v = proposal.variants[el.key]
      if (v) remapped[synthKey(i)] = v
    })
    remappedAnimations.push({ name, variants: remapped })
  }

  // The element graph (silhouette) comes from the first proposal — by the
  // compatibility check above, every other proposal shares the same shapes
  // at the same indices. Stamp synthetic keys on every element that's
  // animated in *any* variant; static-only elements omit a key.
  const animatedIndices = new Set<number>()
  for (const a of remappedAnimations) {
    for (const k of Object.keys(a.variants)) animatedIndices.add(Number(k.replace(/^el/, '')))
  }
  const elementsForRender: SvgElement[] = ref.elements.map((el, i) => {
    return animatedIndices.has(i)
      ? { ...el, key: synthKey(i) }
      : { ...el, key: undefined }
  })

  // Morph const collection mirrors single-variant path.
  let morphCount = 0
  const morphConsts: string[] = []
  const elementsMarkup = elementsForRender
    .map(el =>
      renderElement(el, () => {
        const idx = morphCount++
        const constName = `morphPaths${idx}`
        const literal = el.paths!.map(p => JSON.stringify(p)).join(',\n  ')
        morphConsts.push(`const ${constName} = [\n  ${literal},\n]`)
        return constName
      }),
    )
    .join('\n')
  const usesMorph = morphCount > 0
  const morphImport = usesMorph ? `\nimport MorphPath from '../core/MorphPath.vue'` : ''
  const morphConstsBlock = usesMorph ? '\n' + morphConsts.join('\n') + '\n' : ''

  // Render `animations: { default: { … }, alt: { … } }`.
  const animationBlocks = remappedAnimations
    .map(a => {
      const keys = Object.keys(a.variants)
      if (keys.length === 0) return `    ${jsKey(a.name)}: {},`
      const inner = keys
        .map(k => {
          const v = a.variants[k]
          return [
            `      ${jsKey(k)}: {`,
            `        initial: ${jsLiteral(v.initial, 8)},`,
            `        animate: ${jsLiteral(v.animate, 8)},`,
            `      },`,
          ].join('\n')
        })
        .join('\n')
      return `    ${jsKey(a.name)}: {\n${inner}\n    },`
    })
    .join('\n')

  return `<script setup lang="ts">
// Auto-generated by Forge from a multi-variant Claude proposal. Source: hand-written.
// Safe to hand-edit — port-icons.mjs only overwrites icons sourced from animate-ui.
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'${morphImport}
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
${morphConstsBlock}
const animations = {
${animationBlocks}
} satisfies Record<string, Record<string, Variants>>

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

  <motion.svg
    v-else
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
${elementsMarkup}
  </motion.svg>
</template>
`
}

function renderAnimationsBlock(variants: Record<string, VariantSet>): string {
  const lines: string[] = []
  for (const [key, set] of Object.entries(variants)) {
    lines.push(`    ${jsKey(key)}: {`)
    lines.push(`      initial: ${jsLiteral(set.initial, 6)},`)
    lines.push(`      animate: ${jsLiteral(set.animate, 6)},`)
    lines.push(`    },`)
  }
  return lines.join('\n')
}

function renderElement(
  el: SvgElement,
  registerMorph: () => string,
): string {
  // Morph element: render <MorphPath> with the d-chain (declared as a script
  // const above) instead of motion.path.
  if (el.tag === 'path' && Array.isArray(el.paths) && el.paths.length >= 2) {
    const constName = registerMorph()
    const lines: string[] = [`    <MorphPath`]
    lines.push(`      :paths="${constName}"`)
    if (el.key) {
      lines.push(`      :variants="variants.${jsKey(el.key)}"`)
      lines.push(`      initial="initial"`)
      lines.push(`      :animate="current"`)
      lines.push(`      @animation-complete="notifyComplete"`)
    }
    lines.push(`    />`)
    return lines.join('\n')
  }

  const tag = el.key ? `motion.${el.tag}` : el.tag
  const lines: string[] = [`    <${tag}`]
  for (const [k, v] of Object.entries(el.attrs ?? {})) {
    lines.push(`      ${k}="${escapeAttr(String(v))}"`)
  }
  if (el.key) {
    lines.push(`      :variants="variants.${jsKey(el.key)}"`)
    lines.push(`      initial="initial"`)
    lines.push(`      :animate="current"`)
    lines.push(`      @animationComplete="notifyComplete"`)
  }
  lines.push(`    />`)
  return lines.join('\n')
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

const VALID_JS_IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

function jsKey(key: string): string {
  return VALID_JS_IDENT.test(key) ? key : JSON.stringify(key)
}

/**
 * JS-object-literal pretty-printer for variant payloads. Like JSON.stringify
 * but emits unquoted keys when they're valid JS identifiers, so the generated
 * SFC reads like a hand-written one.
 */
function jsLiteral(value: unknown, indent: number): string {
  return formatValue(value, indent)
}

function formatValue(value: unknown, indent: number): string {
  if (value === null) return 'null'
  if (typeof value === 'string') {
    // The model emits `repeat: "Infinity"` because JSON can't represent the
    // numeric Infinity literal. Translate back to the JS literal so the
    // generated SFC actually loops at runtime.
    if (value === 'Infinity') return 'Infinity'
    if (value === '-Infinity') return '-Infinity'
    return JSON.stringify(value)
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const allScalar = value.every(
      v =>
        v === null ||
        typeof v === 'number' ||
        typeof v === 'string' ||
        typeof v === 'boolean',
    )
    if (allScalar) {
      return `[${value.map(v => formatValue(v, indent)).join(', ')}]`
    }
    const inner = value.map(v => ' '.repeat(indent + 2) + formatValue(v, indent + 2))
    return `[\n${inner.join(',\n')},\n${' '.repeat(indent)}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(
      ([k, v]) =>
        `${' '.repeat(indent + 2)}${jsKey(k)}: ${formatValue(v, indent + 2)}`,
    )
    return `{\n${lines.join(',\n')},\n${' '.repeat(indent)}}`
  }
  return JSON.stringify(value)
}

/**
 * Insert into `icons-meta.ts` in alphabetical-by-kebab position. No-op if
 * the icon already exists.
 */
async function insertIntoIconsMeta(
  kebab: string,
  pascal: string,
  variantNames: string[],
): Promise<boolean> {
  const content = await fs.readFile(ICONS_META_PATH, 'utf8')
  const existsRe = new RegExp(`\\{\\s*kebab:\\s*'${escapeRe(kebab)}'`)
  if (existsRe.test(content)) return false

  const animationsLiteral = variantNames
    .map(n => `{ name: '${n}', source: 'hand-written' }`)
    .join(', ')
  const newLine = `  { kebab: '${kebab}', pascal: '${pascal}', animations: [${animationsLiteral}] },`
  const updated = spliceAtSorted(content, /^\s*\{\s*kebab:\s*'([^']+)'/, kebab, newLine)
  await fs.writeFile(ICONS_META_PATH, updated, 'utf8')
  return true
}

async function insertIntoIndex(kebab: string, pascal: string): Promise<boolean> {
  const content = await fs.readFile(INDEX_PATH, 'utf8')
  const existsLine = `from './icons/${kebab}.vue'`
  if (content.includes(existsLine)) return false

  const newLine = `export { default as ${pascal}, default as ${pascal}Animated } from './icons/${kebab}.vue'`
  const updated = spliceAtSorted(content, /from '\.\/icons\/([^']+)\.vue'/, kebab, newLine)
  await fs.writeFile(INDEX_PATH, updated, 'utf8')
  return true
}

/**
 * Find lines matching `lineRe` (capture group 1 = kebab name) and splice
 * `newLine` in front of the first one whose kebab is alphabetically greater
 * than `kebab`. Falls back to inserting after the last match.
 */
function spliceAtSorted(
  content: string,
  lineRe: RegExp,
  kebab: string,
  newLine: string,
): string {
  const lines = content.split('\n')
  const matches: { idx: number; kebab: string }[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(lineRe)
    if (m) matches.push({ idx: i, kebab: m[1] })
  }
  if (matches.length === 0) {
    throw new Error('Could not find any existing icon entries to anchor to')
  }
  const before = matches.find(e => e.kebab > kebab)
  const insertAt = before ? before.idx : matches[matches.length - 1].idx + 1
  lines.splice(insertAt, 0, newLine)
  return lines.join('\n')
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
