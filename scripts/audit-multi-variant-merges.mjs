#!/usr/bin/env node
/**
 * Audit every icon that we've previously folded into a multi-variant SFC.
 * Re-parses each pair's pre-merge base + sibling sources from git history,
 * re-renders via the current `port-pqoqubbw-icons.mjs` parser/renderer,
 * and compares byte-for-byte against the on-disk merged SFC. A diff means
 * the on-disk version is missing data the current parser would capture —
 * typically because an earlier parser bug stripped attrs (Bot's
 * `<rect width height>` was the canonical regression) or dropped a root
 * `:variants` binding (bot-message-square's head wobble).
 *
 * Run periodically (or after parser changes) to catch silent data loss.
 *
 *   node scripts/audit-multi-variant-merges.mjs           # report only
 *   node scripts/audit-multi-variant-merges.mjs --write   # apply re-render
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseSfcToMultiVariantData,
  renderMultiVariantSfc,
  expandVforForMerge,
} from './port-pqoqubbw-icons.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ICONS_DIR = join(ROOT, 'src/icons')
const WRITE = process.argv.includes('--write')

/**
 * Each entry pins the commit that DELETED the sibling SFC. We read pre-merge
 * sources from `${sha}^` — i.e., one commit before the deletion. New merges
 * should append to this list as they ship.
 */
const PAIRS = [
  ['audio-lines',         'audio-lines-2',           '74bb158'],
  ['cast',                'cast-2',                  'a66f07d'],
  ['message-circle',      'message-circle-2',        'a66f07d'],
  ['message-square',      'message-square-2',        'a66f07d'],
  ['sun',                 'sun-2',                   'a66f07d'],
  ['sun-medium',          'sun-medium-2',            'a66f07d'],
  ['terminal',            'terminal-2',              'a66f07d'],
  ['send',                'send-2',                  '62cddaa'],
  ['bot',                 'bot-2',                   'e142950'],
  ['bot-message-square',  'bot-message-square-2',    'e142950'],
  ['compass',             'compass-2',               'e142950'],
  ['message-circle-more', 'message-circle-more-2',   'e142950'],
  ['message-square-more', 'message-square-more-2',   'e142950'],
  ['moon',                'moon-2',                  'e142950'],
  ['plus',                'plus-2',                  'e142950'],
  ['x',                   'x-2',                     'e142950'],
]

const kebabToPascal = k =>
  k.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')

const reread = (sha, path) =>
  execSync(`git -C ${ROOT} show ${sha}^:${path}`, { encoding: 'utf8' })

const issues = []
for (const [base, sibling, sha] of PAIRS) {
  let fresh, onDisk
  try {
    const baseData = parseSfcToMultiVariantData(reread(sha, `src/icons/${base}.vue`))
    // Expand v-for'd elements before parsing — pqoqubbw `.map()` collapses
    // to a single Vue v-for in the upstream-rendered SFC, which the merger
    // can't carry into MultiVariantIcon's plain SvgElement[] graph (sun and
    // sun-medium were the visible regressions before this preprocessor).
    const altSrc = expandVforForMerge(reread(sha, `src/icons/${sibling}.vue`))
    const altData = parseSfcToMultiVariantData(altSrc)
    fresh = renderMultiVariantSfc({ pascal: kebabToPascal(base), baseData, altData })
    onDisk = readFileSync(join(ICONS_DIR, `${base}.vue`), 'utf8')
  } catch (e) {
    issues.push({ base, sibling, error: e.message })
    continue
  }
  if (fresh !== onDisk) {
    issues.push({ base, sibling, freshLen: fresh.length, diskLen: onDisk.length })
    if (WRITE) writeFileSync(join(ICONS_DIR, `${base}.vue`), fresh)
  }
}

console.log(`Audited ${PAIRS.length} merged icons.`)
console.log(`  ${issues.length} produce different output under the current parser.`)
if (issues.length) {
  console.log('\nIcons whose on-disk SFC would change if re-merged:')
  for (const i of issues) {
    if (i.error) {
      console.log(`  ${i.base.padEnd(24)}  error: ${i.error}`)
    } else {
      console.log(`  ${i.base.padEnd(24)}  disk=${i.diskLen}  fresh=${i.freshLen}  diff=${i.freshLen - i.diskLen}`)
    }
  }
  if (!WRITE) console.log('\nRe-run with --write to apply the canonical re-render.')
  process.exit(WRITE ? 0 : 1)
}
