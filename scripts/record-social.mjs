// Record the dense-grid social asset (Asset A).
//
// Target surface: Twitter/X, Reddit, LinkedIn. 1:1 aspect so it renders large
// on mobile feeds. The recording is a ripple — mouseenter events fire through
// the grid in a staggered wave, so at any given frame a dozen icons are
// mid-animation. That's what makes the asset scroll-stopping.
//
// Writes docs/social.webm, docs/social.mp4, docs/social.gif.
//
// Usage:
//   pnpm docs:dev              # in one terminal
//   pnpm docs:social

import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  DEFAULT_BASE_URL,
  assertDevServer,
  launchRecorder,
  finalizeWebm,
  webmToMp4,
  webmToGif,
} from './_capture-util.mjs'

const PAGE_URL = DEFAULT_BASE_URL
const OUT_DIR = new URL('../docs/', import.meta.url).pathname
const TMP_DIR = new URL('../.tmp-social/', import.meta.url).pathname

// 48 visually diverse icons: mix of one-shots and infinite loopers, mix of
// strokes and fills, no two neighbours with similar motion. Ordering matters
// for the ripple wave — adjacent cards fire sequentially, so a neighbour with
// a similar silhouette would read as the "same icon twice" on hover.
const ICONS = [
  'heart',       'sparkles',    'star',        'bell',        'rocket',      'lightbulb',
  'flame',       'zap',         'sun',         'moon',        'coffee',      'loader-circle',
  'refresh-cw',  'rotate-cw',   'send',        'settings',    'link-2',      'external-link',
  'download',    'upload',      'play',        'pause',       'volume-2',    'mic',
  'search',      'eye',         'lock',        'key',         'bookmark',    'bookmark-check',
  'thumbs-up',   'message-circle', 'users',    'map-pin',     'home',        'calendar-days',
  'paintbrush',  'scissors',    'pen-tool',    'file-text',   'copy',        'clipboard',
  'plus',        'check',       'circle-check','arrow-right', 'trash-2',     'archive',
]

// 1080x1080 is 6 cols × 8 rows at ~180x135 per card — plenty of room for the
// 38px icon plus the kebab label underneath.
const VIEWPORT = { width: 1080, height: 1080 }
const COLS = 6
const ROWS = 8

// Per-card hover duration + stagger. Tuned so a dozen icons are visible
// mid-animation at the peak of the wave.
const STAGGER_MS = 90
const HOVER_MS = 1800
const TAIL_MS = 900
const TRIM_LEAD_MS = 1200

async function main() {
  if (ICONS.length !== COLS * ROWS) {
    throw new Error(`ICONS length ${ICONS.length} != ${COLS}x${ROWS}`)
  }
  await assertDevServer(PAGE_URL)
  await mkdir(OUT_DIR, { recursive: true })
  const { browser, ctx, page } = await launchRecorder({ viewport: VIEWPORT, tmpDir: TMP_DIR })

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.card', { state: 'visible' })

  await page.evaluate(({ names, cols, rows }) => {
    const set = new Set(names)
    // Sort cards into our curated order rather than alphabetical.
    const rank = new Map(names.map((n, i) => [n, i]))
    const cards = [...document.querySelectorAll('.card')]
    const kept = []
    for (const card of cards) {
      const label = card.querySelector('.name')?.textContent?.trim() ?? ''
      if (set.has(label)) kept.push(card)
      else card.style.display = 'none'
    }
    kept.sort((a, b) => {
      const ak = a.querySelector('.name')?.textContent?.trim() ?? ''
      const bk = b.querySelector('.name')?.textContent?.trim() ?? ''
      return rank.get(ak) - rank.get(bk)
    })

    // Strip chrome.
    const topbar = document.querySelector('header, .topbar, [class*="TopBar"]')
    if (topbar) topbar.style.display = 'none'
    const footer = document.querySelector('.foot')
    if (footer) footer.style.display = 'none'
    document.body.style.margin = '0'

    const grid = document.querySelector('.grid')
    if (grid) {
      // Re-insert curated cards in order so the grid flows correctly.
      for (const c of kept) grid.appendChild(c)
      Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '14px',
        padding: '28px',
        maxWidth: 'none',
        height: '100vh',
        boxSizing: 'border-box',
      })
    }

    // Normalize each card so the layout is even across the grid.
    for (const c of kept) {
      Object.assign(c.style, {
        minHeight: '0',
        height: '100%',
      })
    }
  }, { names: ICONS, cols: COLS, rows: ROWS })

  await page.waitForTimeout(500)

  // Pre-trigger a scattered first-frame set so trim point 1 isn't empty.
  await page.evaluate((indices) => {
    const cards = [...document.querySelectorAll('.card')].filter(
      c => c.offsetParent !== null,
    )
    for (const i of indices) {
      const c = cards[i]
      if (c) c.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    }
  }, [0, 7, 14, 21, 28, 35, 42])
  await page.waitForTimeout(350)

  // Ripple: stagger mouseenter across all cards, hold each for HOVER_MS,
  // then mouseleave. Runs entirely in-page so we don't pay JS↔Playwright
  // round-trip per card (that jitters timing on slow CI boxes).
  await page.evaluate(
    ({ stagger, hoverMs }) => {
      return new Promise((resolve) => {
        const cards = [...document.querySelectorAll('.card')].filter(
          c => c.offsetParent !== null,
        )
        let done = 0
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
            setTimeout(() => {
              card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
              if (++done === cards.length) resolve()
            }, hoverMs)
          }, i * stagger)
        })
      })
    },
    { stagger: STAGGER_MS, hoverMs: HOVER_MS },
  )

  await page.waitForTimeout(TAIL_MS)

  await ctx.close()
  await browser.close()

  const webmPath = join(OUT_DIR, 'social.webm')
  await finalizeWebm(TMP_DIR, webmPath)

  const mp4Path = join(OUT_DIR, 'social.mp4')
  await webmToMp4(webmPath, mp4Path, { trimLeadMs: TRIM_LEAD_MS, fps: 30, crf: 20 })

  const gifPath = join(OUT_DIR, 'social.gif')
  await webmToGif(webmPath, gifPath, { trimLeadMs: TRIM_LEAD_MS, fps: 18, width: 720, colors: 160 })

  console.log(`wrote ${webmPath}`)
  console.log(`wrote ${mp4Path}`)
  console.log(`wrote ${gifPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
