/**
 * Persist a proposal (+verdict/usage/cost) to `forge/saved_runs/<icon>-<date>.json`
 * for later inspection. Used as the fallback when the user picks a proposal
 * for an icon that already lives in `src/icons/` — we refuse to merge into
 * the existing SFC, but stash the JSON so nothing is lost.
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ExportRequest } from './schema'

const here = dirname(fileURLToPath(import.meta.url))
const SAVED_RUNS_DIR = join(here, '../saved_runs')

export async function exportProposal(req: ExportRequest): Promise<{ filePath: string }> {
  await fs.mkdir(SAVED_RUNS_DIR, { recursive: true })
  const kebab = req.iconName.trim().toLowerCase()
  const stamp = formatStamp(new Date())
  let filePath = join(SAVED_RUNS_DIR, `${kebab}-${stamp}.json`)
  // Sub-second collision: bump a counter rather than clobber.
  let n = 2
  while (await exists(filePath)) {
    filePath = join(SAVED_RUNS_DIR, `${kebab}-${stamp}-${n}.json`)
    n++
  }
  const payload = {
    proposal: req.proposal,
    verdict: req.verdict,
    usage: req.usage,
    cost: req.cost,
    tier: req.tier,
  }
  await fs.writeFile(filePath, JSON.stringify(payload), 'utf8')
  return { filePath }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

function formatStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}
