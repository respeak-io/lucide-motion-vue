import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { iconsMeta } from '../../src/icons-meta'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(HERE, '../.cache/lucide-svgs')
const NAMES_CACHE_PATH = join(HERE, '../.cache/lucide-names.json')
const NAMES_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Fetch a raw Lucide SVG by kebab-case name. Caches to disk so repeat runs
 * don't re-hit GitHub.
 */
export async function fetchLucideSvg(name: string): Promise<string> {
  const safe = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (safe !== name.toLowerCase()) {
    throw new Error(`Invalid icon name: ${name}`)
  }
  await mkdir(CACHE_DIR, { recursive: true })
  const cachePath = join(CACHE_DIR, `${safe}.svg`)
  if (existsSync(cachePath)) {
    return await readFile(cachePath, 'utf8')
  }
  const url = `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${safe}.svg`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  const svg = await res.text()
  await writeFile(cachePath, svg, 'utf8')
  return svg
}

interface NamesCache {
  fetched_at: number
  names: string[]
}

/**
 * Fetch the full list of Lucide icon kebab-names by walking the
 * `lucide-icons/lucide` repo tree on GitHub. Two requests:
 *
 *   1. root tree → find the `icons` directory's SHA
 *   2. that subtree → enumerate `*.svg` blobs
 *
 * Beats the contents API (paginated, capped) and the recursive root tree
 * (truncated for large repos like this). Cached to disk for 24h. Honors
 * `GITHUB_TOKEN` if set so authenticated runs avoid the 60-req/h anonymous
 * rate limit, but works fine without.
 */
export async function fetchAllLucideNames(
  options: { force?: boolean } = {},
): Promise<string[]> {
  if (!options.force) {
    const cached = await readNamesCache()
    if (cached) return cached
  }
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const rootUrl =
    'https://api.github.com/repos/lucide-icons/lucide/git/trees/main'
  const rootRes = await fetch(rootUrl, { headers })
  if (!rootRes.ok) throw await ghError(rootRes, rootUrl)
  const rootTree = (await rootRes.json()) as {
    tree: Array<{ path: string; type: string; sha: string }>
  }
  const iconsEntry = rootTree.tree.find(
    e => e.path === 'icons' && e.type === 'tree',
  )
  if (!iconsEntry) {
    throw new Error('Could not locate `icons` subtree in lucide repo root.')
  }

  const subUrl = `https://api.github.com/repos/lucide-icons/lucide/git/trees/${iconsEntry.sha}`
  const subRes = await fetch(subUrl, { headers })
  if (!subRes.ok) throw await ghError(subRes, subUrl)
  const subTree = (await subRes.json()) as {
    tree: Array<{ path: string; type: string }>
    truncated: boolean
  }
  if (subTree.truncated) {
    // Fallback would be paginated contents; flag it loudly so we notice
    // before silently shipping a short list.
    throw new Error(
      'Lucide icons subtree response was truncated by GitHub — name list is incomplete.',
    )
  }
  const names = subTree.tree
    .filter(e => e.type === 'blob' && e.path.endsWith('.svg'))
    .map(e => e.path.replace(/\.svg$/, ''))
    .sort()

  await mkdir(dirname(NAMES_CACHE_PATH), { recursive: true })
  const payload: NamesCache = { fetched_at: Date.now(), names }
  await writeFile(NAMES_CACHE_PATH, JSON.stringify(payload), 'utf8')
  return names
}

async function readNamesCache(): Promise<string[] | null> {
  if (!existsSync(NAMES_CACHE_PATH)) return null
  try {
    const st = await stat(NAMES_CACHE_PATH)
    const raw = await readFile(NAMES_CACHE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as NamesCache
    const age = Date.now() - parsed.fetched_at
    if (age > NAMES_TTL_MS) return null
    void st
    return parsed.names
  } catch {
    return null
  }
}

async function ghError(res: Response, url: string): Promise<Error> {
  let bodyHint = ''
  try {
    const body = await res.text()
    bodyHint = `: ${body.slice(0, 200)}`
  } catch {
    /* ignore */
  }
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    return new Error(
      `GitHub rate limit hit fetching ${url}. Set GITHUB_TOKEN in forge/.env to lift the 60-req/h anonymous cap.`,
    )
  }
  return new Error(
    `GitHub API ${res.status} ${res.statusText} for ${url}${bodyHint}`,
  )
}

/**
 * Lucide names not present in our library. Compared against `iconsMeta.kebab`,
 * which is the canonical kebab name for ported icons. Numbered siblings
 * (`send-2`, `moon-2`) live in iconsMeta as their own entries, so an upstream
 * `send` correctly reports as "already covered" if `send` is present, even if
 * `send-2` exists too.
 */
export async function diffMissing(): Promise<string[]> {
  const all = await fetchAllLucideNames()
  const have = new Set(iconsMeta.map(m => m.kebab))
  return all.filter(n => !have.has(n))
}
