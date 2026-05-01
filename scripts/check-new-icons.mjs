#!/usr/bin/env node
/**
 * Quick "what's new upstream" reporter. Hits the GitHub contents API for
 * animate-ui and pqoqubbw, and prints the icons that aren't yet in our
 * `src/icons-meta.ts`. No clone, no port — just a missing-list view so a
 * maintainer can decide whether a fresh `port-icons.mjs` / `port-pqoqubbw-icons.mjs`
 * run is worthwhile.
 *
 * Usage:
 *   node scripts/check-new-icons.mjs                    # both sources
 *   node scripts/check-new-icons.mjs --source=animate-ui
 *   node scripts/check-new-icons.mjs --source=pqoqubbw
 *   node scripts/check-new-icons.mjs --json             # machine-readable
 *
 * Honours GITHUB_TOKEN to avoid the 60-req/h anonymous rate limit.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const args = process.argv.slice(2)
const sourceArg = (args.find(a => a.startsWith('--source=')) || '').split('=')[1] || 'all'
const asJson = args.includes('--json')

const SOURCES = {
  'animate-ui': {
    label: 'animate-ui',
    repoUrl: 'https://github.com/imskyleen/animate-ui',
    listKebabs: listAnimateUiKebabs,
  },
  pqoqubbw: {
    label: 'pqoqubbw/icons (lucide-animated)',
    repoUrl: 'https://github.com/pqoqubbw/icons',
    listKebabs: listPqoqubbwKebabs,
  },
}

if (sourceArg !== 'all' && !(sourceArg in SOURCES)) {
  console.error(`Unknown --source=${sourceArg}. Valid: animate-ui, pqoqubbw, all.`)
  process.exit(2)
}

const sources = sourceArg === 'all' ? Object.keys(SOURCES) : [sourceArg]
const have = readLocalKebabs()

const report = {}
for (const key of sources) {
  const { label, listKebabs, repoUrl } = SOURCES[key]
  try {
    const upstream = await listKebabs()
    const missing = upstream.filter(k => !have.has(k)).sort()
    report[key] = { label, repoUrl, upstream_count: upstream.length, missing }
  } catch (e) {
    report[key] = { label, repoUrl, error: e.message }
  }
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
} else {
  for (const [key, r] of Object.entries(report)) {
    console.log(`\n=== ${r.label} ===`)
    if (r.error) {
      console.log(`  error: ${r.error}`)
      continue
    }
    console.log(`  upstream icons: ${r.upstream_count}`)
    console.log(`  not in our library: ${r.missing.length}`)
    if (r.missing.length === 0) continue
    console.log()
    // Print in 4 columns at ~24 chars each so the list scans quickly.
    const W = 24
    const cols = 4
    for (let i = 0; i < r.missing.length; i += cols) {
      console.log('  ' + r.missing.slice(i, i + cols).map(n => n.padEnd(W)).join(''))
    }
    console.log(`\n  → import via: node scripts/port-${key}-icons.mjs --only=<name>${key === 'animate-ui' ? '' : ' [--force]'}`)
  }
}

// --- helpers ---

function readLocalKebabs() {
  const metaPath = join(ROOT, 'src/icons-meta.ts')
  const src = readFileSync(metaPath, 'utf8')
  const set = new Set()
  for (const m of src.matchAll(/kebab:\s*'([^']+)'/g)) set.add(m[1])
  return set
}

/**
 * Two-step git-tree walk for animate-ui. The icons live deep at
 * `apps/www/registry/icons/<kebab>/index.tsx`, so we resolve each path
 * segment's tree SHA in turn — the GitHub contents API caps at ~1000 entries
 * per dir which is fine here, but using the git-tree endpoint (with explicit
 * SHAs) is more robust against repo restructuring.
 */
async function listAnimateUiKebabs() {
  const root = await ghTree('imskyleen', 'animate-ui', 'main')
  const apps = await resolveSubtree(root, 'apps', 'imskyleen', 'animate-ui')
  const www = await resolveSubtree(apps, 'www', 'imskyleen', 'animate-ui')
  const registry = await resolveSubtree(www, 'registry', 'imskyleen', 'animate-ui')
  const icons = await resolveSubtree(registry, 'icons', 'imskyleen', 'animate-ui')
  return icons.tree
    .filter(e => e.type === 'tree' && e.path !== 'icon')
    .map(e => e.path)
}

/**
 * Single-step walk for pqoqubbw. All icons sit flat in `icons/<kebab>.tsx`.
 * Strip the suffix and we're done.
 */
async function listPqoqubbwKebabs() {
  const root = await ghTree('pqoqubbw', 'icons', 'main')
  const iconsTree = await resolveSubtree(root, 'icons', 'pqoqubbw', 'icons')
  return iconsTree.tree
    .filter(e => e.type === 'blob' && e.path.endsWith('.tsx'))
    .map(e => e.path.replace(/\.tsx$/, ''))
}

async function ghTree(owner, repo, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}`
  const res = await fetch(url, { headers: ghHeaders() })
  if (!res.ok) throw new Error(await ghError(res, url))
  const json = await res.json()
  if (json.truncated) {
    throw new Error(`GitHub truncated tree for ${url} — list will be incomplete.`)
  }
  return json
}

async function resolveSubtree(parent, name, owner, repo) {
  const entry = parent.tree.find(e => e.path === name && e.type === 'tree')
  if (!entry) throw new Error(`No subtree '${name}' under parent`)
  return await ghTree(owner, repo, entry.sha)
}

function ghHeaders() {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function ghError(res, url) {
  let body = ''
  try { body = (await res.text()).slice(0, 200) } catch {}
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    return `GitHub rate limit hit on ${url}. Set GITHUB_TOKEN to lift the 60-req/h anonymous cap.`
  }
  return `${res.status} ${res.statusText} on ${url}: ${body}`
}
