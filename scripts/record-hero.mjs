// Record an animated hero for the README.
//
// Spins up a headless Chromium, loads the docs dev server, hides all but a
// curated subset of icon cards, then hovers each in sequence so the on-hover
// animation plays. The whole page is recorded to a webm; a separate step
// (see package scripts / the CLI) converts it to an optimized gif.
//
// Usage:
//   pnpm docs:dev              # in one terminal
//   node scripts/record-hero.mjs
//
// Output: docs/hero.webm (raw) — caller converts to docs/hero.gif with ffmpeg.

import { chromium } from 'playwright'
import { mkdir, rename, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const HERO_URL = process.env.HERO_URL ?? 'http://localhost:5174/'
const OUT_DIR = new URL('../docs/', import.meta.url).pathname
const TMP_DIR = new URL('../.tmp-hero/', import.meta.url).pathname

// Curated set — visually varied, mix of one-shots and infinite-loopers.
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

const HOVER_MS = 900       // how long to rest on each card
const SETTLE_MS = 400      // pause between hovers (moves cursor away so one-shots reset)
const VIEWPORT = { width: 1100, height: 560 }

async function main() {
  if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true })
  await mkdir(TMP_DIR, { recursive: true })
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    recordVideo: { dir: TMP_DIR, size: VIEWPORT },
  })
  const page = await ctx.newPage()

  await page.goto(HERO_URL, { waitUntil: 'networkidle' })

  // Wait for the grid to be populated.
  await page.waitForSelector('.card', { state: 'visible' })

  // Hide everything except our curated icons, and strip the surrounding chrome
  // so the recorded frame is all icons.
  await page.evaluate((names) => {
    const set = new Set(names)
    for (const card of document.querySelectorAll('.card')) {
      const label = card.querySelector('.name')?.textContent?.trim() ?? ''
      if (!set.has(label)) (card).style.display = 'none'
    }
    // Hide topbar / footer to focus the frame on the icon grid.
    const topbar = document.querySelector('header, .topbar, [class*="TopBar"]')
    if (topbar) (topbar).style.display = 'none'
    const footer = document.querySelector('.foot')
    if (footer) (footer).style.display = 'none'

    // Tighten grid to one row-ish, centered.
    const grid = document.querySelector('.grid')
    if (grid) {
      Object.assign((grid).style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${names.length}, 1fr)`,
        gap: '18px',
        padding: '24px',
        maxWidth: 'none',
      })
    }
    document.body.style.margin = '0'
  }, ICONS)

  // Let any layout/scroll settle.
  await page.waitForTimeout(400)

  // Hover each card in order.
  for (const name of ICONS) {
    const card = page.locator('.card', { has: page.locator('.name', { hasText: new RegExp(`^${name}$`) }) }).first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    await page.waitForTimeout(HOVER_MS)
    // Move cursor away so the one-shot animation resets before the next hover.
    await page.mouse.move(0, 0)
    await page.waitForTimeout(SETTLE_MS)
  }

  // Final beat so the video doesn't cut mid-animation.
  await page.waitForTimeout(400)

  await ctx.close()
  await browser.close()

  // Move the recorded webm to docs/hero.webm.
  const files = await readdir(TMP_DIR)
  const webm = files.find(f => f.endsWith('.webm'))
  if (!webm) throw new Error('no webm recorded')
  const target = join(OUT_DIR, 'hero.webm')
  await rename(join(TMP_DIR, webm), target)
  await rm(TMP_DIR, { recursive: true, force: true })
  console.log(`wrote ${target}`)
}

main().catch(e => { console.error(e); process.exit(1) })
