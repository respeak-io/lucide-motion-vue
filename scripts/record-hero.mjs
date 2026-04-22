// Record the thin README banner (Asset B).
//
// Spins up headless Chromium, loads the docs gallery, hides everything except
// a curated row of icons, then hovers each in sequence. Writes docs/hero.webm
// and docs/hero.gif; the gif's first frame is what GitHub displays as the
// static thumbnail before you hit Play, so the capture deliberately
// pre-triggers the first icon before the trim point.
//
// Usage:
//   pnpm docs:dev              # in one terminal
//   pnpm docs:hero

import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  DEFAULT_BASE_URL,
  assertDevServer,
  launchRecorder,
  finalizeWebm,
  webmToGif,
} from './_capture-util.mjs'

const PAGE_URL = DEFAULT_BASE_URL
const OUT_DIR = new URL('../docs/', import.meta.url).pathname
const TMP_DIR = new URL('../.tmp-hero/', import.meta.url).pathname

const ICONS = [
  'heart',
  'bell',
  'sparkles',
  'send',
  'settings',
  'star',
  'loader-circle',
  'refresh-cw',
]

const VIEWPORT = { width: 1100, height: 560 }
const HOVER_MS = 900
const SETTLE_MS = 400
// Trim the pre-navigation blank frames; the first gif frame becomes the
// pre-triggered first icon mid-animation.
const TRIM_LEAD_MS = 1700

async function main() {
  await assertDevServer(PAGE_URL)
  await mkdir(OUT_DIR, { recursive: true })
  const { browser, ctx, page } = await launchRecorder({ viewport: VIEWPORT, tmpDir: TMP_DIR })

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.card', { state: 'visible' })

  await page.evaluate((names) => {
    const set = new Set(names)
    for (const card of document.querySelectorAll('.card')) {
      const label = card.querySelector('.name')?.textContent?.trim() ?? ''
      if (!set.has(label)) card.style.display = 'none'
    }
    const topbar = document.querySelector('header, .topbar, [class*="TopBar"]')
    if (topbar) topbar.style.display = 'none'
    const footer = document.querySelector('.foot')
    if (footer) footer.style.display = 'none'

    const grid = document.querySelector('.grid')
    if (grid) {
      Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${names.length}, 1fr)`,
        gap: '18px',
        padding: '24px',
        maxWidth: 'none',
      })
    }
    document.body.style.margin = '0'
  }, ICONS)

  await page.waitForTimeout(400)

  // Pre-trigger the first icon so the webm already shows motion by the time
  // the lead-trim point lands. Without this, the trimmed-gif's frame 1 is
  // just the static gallery.
  await page.evaluate((first) => {
    const card = [...document.querySelectorAll('.card')].find(
      c => c.querySelector('.name')?.textContent?.trim() === first,
    )
    if (card) card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
  }, ICONS[0])
  await page.waitForTimeout(250)

  for (const name of ICONS) {
    const card = page.locator('.card', { has: page.locator('.name', { hasText: new RegExp(`^${name}$`) }) }).first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    await page.waitForTimeout(HOVER_MS)
    await page.mouse.move(0, 0)
    await page.waitForTimeout(SETTLE_MS)
  }

  await page.waitForTimeout(400)

  await ctx.close()
  await browser.close()

  const webmPath = join(OUT_DIR, 'hero.webm')
  await finalizeWebm(TMP_DIR, webmPath)

  const gifPath = join(OUT_DIR, 'hero.gif')
  // Crop off the empty space below the card row — the viewport is sized
  // generously for layout stability, but the README banner only wants the
  // cards themselves.
  await webmToGif(webmPath, gifPath, { trimLeadMs: TRIM_LEAD_MS, fps: 18, width: 800, crop: '800:200:0:0' })

  console.log(`wrote ${webmPath}`)
  console.log(`wrote ${gifPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
