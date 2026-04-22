// Record the single-icon close-up (Asset C).
//
// Takes one icon with multiple variants, fills the 1:1 viewport with it, and
// cycles through variants back-to-back. The video is short (~10-14s) and
// designed for quote-replies on Twitter, where the viewer's eye stays locked
// on a single motion story instead of scanning a grid.
//
// Default icon: link-2 (5 variants — default, apart, unlink, unlink-loop,
// link). Override with CAPTURE_ICON=<kebab>.
//
// Writes docs/closeup.webm, docs/closeup.mp4, docs/closeup.gif.
//
// Usage:
//   pnpm docs:dev              # in one terminal
//   pnpm docs:closeup

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

const BASE_URL = DEFAULT_BASE_URL
const ICON = process.env.CAPTURE_ICON ?? 'link-2'
const PAGE_URL = `${BASE_URL.replace(/\/$/, '')}/#/playground/${ICON}`
const OUT_DIR = new URL('../docs/', import.meta.url).pathname
const TMP_DIR = new URL('../.tmp-closeup/', import.meta.url).pathname

const VIEWPORT = { width: 1080, height: 1080 }
// How long to sit on each variant before switching. Tuned for one-shot
// animations that run ~700-1500ms; looping variants just repeat during the
// hold. Increase if a specific variant you pick has a longer runtime.
const VARIANT_HOLD_MS = 2200
const LEAD_IN_MS = 700
const TAIL_MS = 600
const TRIM_LEAD_MS = 1400

async function main() {
  await assertDevServer(BASE_URL)
  await mkdir(OUT_DIR, { recursive: true })
  const { browser, ctx, page } = await launchRecorder({ viewport: VIEWPORT, tmpDir: TMP_DIR })

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.pg-stage', { state: 'visible' })

  // Flip to programmatic trigger so each variant selection re-mounts-and-plays
  // on its own, no hover required.
  await page.locator('.pg-knobs select').selectOption('animate')

  // Strip all UI except the stage. The playground's scoped CSS forces
  // aspect-ratio 16/10, max-height 380px, a dot-grid ::before pseudo, rounded
  // borders, and shadow — all of which keep the stage boxed into a corner of
  // the viewport. Nuke them with an injected stylesheet (!important wins over
  // anything else) rather than trying to override inline style-by-style.
  //
  // The SVG is reached via a descendant selector (not `>`) because each icon
  // self-wraps in an AnimateIcon <span> when it gets trigger props directly —
  // so the DOM is <pg-stage-inner><span><svg/></span></pg-stage-inner>. The
  // stylesheet keeps working across Vue re-renders when the SVG node is
  // replaced on variant switches.
  await page.evaluate(() => {
    for (const sel of ['.pg-side', '.pg-head', '.pg-stage-hint', '.pg-knobs', 'header', '.topbar', '[class*="TopBar"]', 'footer', '.foot']) {
      for (const el of document.querySelectorAll(sel)) el.style.display = 'none'
    }
    for (const el of document.querySelectorAll('.pg-main > *:not(.pg-stage)')) {
      el.style.display = 'none'
    }

    const style = document.createElement('style')
    style.textContent = `
      html, body, #app { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
      .pg {
        display: block !important;
        position: fixed !important; inset: 0 !important;
        width: 100vw !important; height: 100vh !important;
        margin: 0 !important; padding: 0 !important;
        max-width: none !important; gap: 0 !important;
      }
      .pg-main {
        display: block !important;
        position: absolute !important; inset: 0 !important;
        width: 100% !important; height: 100% !important;
        margin: 0 !important; padding: 0 !important;
        gap: 0 !important;
      }
      .pg-stage {
        position: absolute !important; inset: 0 !important;
        width: 100% !important; height: 100% !important;
        aspect-ratio: auto !important;
        max-height: none !important;
        margin: 0 !important; padding: 0 !important;
        background: #ffffff !important;
        border: 0 !important; border-radius: 0 !important;
        box-shadow: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .pg-stage::before { display: none !important; }
      .pg-stage-inner {
        position: static !important;
        inset: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: auto !important; height: auto !important;
        margin: 0 !important; padding: 0 !important;
        background: transparent !important;
        border: 0 !important; box-shadow: none !important;
      }
      .pg-stage-inner svg {
        transform: scale(4.5) !important;
        transform-origin: center center !important;
      }
    `
    document.head.appendChild(style)
  })

  await page.waitForTimeout(LEAD_IN_MS)

  // Read variant pill labels in DOM order, then cycle through each. Re-read
  // the list on the off chance the order differs from iconsMeta.
  const variantNames = await page.evaluate(() => {
    return [...document.querySelectorAll('.pg-knobs .pill')].map(b => b.textContent?.trim() ?? '')
  })

  for (const name of variantNames) {
    // pg-knobs is display:none so Playwright's visibility check rejects even
    // `force:true` clicks. Raw HTMLElement.click() via page.evaluate fires the
    // synthetic event directly and doesn't care about layout.
    await page.evaluate((n) => {
      const pill = [...document.querySelectorAll('.pg-knobs .pill')].find(
        p => p.textContent?.trim() === n,
      )
      if (pill) pill.click()
    }, name)
    await page.waitForTimeout(VARIANT_HOLD_MS)
  }

  await page.waitForTimeout(TAIL_MS)

  await ctx.close()
  await browser.close()

  const webmPath = join(OUT_DIR, `closeup${ICON === 'link-2' ? '' : '-' + ICON}.webm`)
  await finalizeWebm(TMP_DIR, webmPath)

  const base = webmPath.replace(/\.webm$/, '')
  const mp4Path = `${base}.mp4`
  const gifPath = `${base}.gif`

  await webmToMp4(webmPath, mp4Path, { trimLeadMs: TRIM_LEAD_MS, fps: 30, crf: 20 })
  await webmToGif(webmPath, gifPath, { trimLeadMs: TRIM_LEAD_MS, fps: 20, width: 600, colors: 96 })

  console.log(`wrote ${webmPath}`)
  console.log(`wrote ${mp4Path}`)
  console.log(`wrote ${gifPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
