// Shared plumbing for the Playwright-based capture scripts in this repo.
//
// Each capture follows the same shape: spin up Chromium with a video-recording
// context, drive the docs dev server, close the context to finalize the webm,
// then transcode to mp4 (social) and gif (README) via ffmpeg.
//
// All three scripts (`record-hero`, `record-social`, `record-closeup`) import
// from here. Keep this module dependency-light — only `playwright` and node
// built-ins, plus a spawn'd `ffmpeg` binary on PATH.

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, rename, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_BASE_URL = process.env.CAPTURE_URL ?? 'http://localhost:5174/'

/**
 * Launch a Playwright context that records video to `tmpDir`.
 * Returns { browser, ctx, page } — caller is responsible for closing them.
 */
export async function launchRecorder({ viewport, tmpDir, deviceScaleFactor = 2 }) {
  if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor,
    recordVideo: { dir: tmpDir, size: viewport },
  })
  const page = await ctx.newPage()
  return { browser, ctx, page }
}

/**
 * After closing the context, rename the single recorded webm out of `tmpDir`
 * to `destWebm` and clean up.
 */
export async function finalizeWebm(tmpDir, destWebm) {
  const files = await readdir(tmpDir)
  const webm = files.find(f => f.endsWith('.webm'))
  if (!webm) throw new Error(`no webm recorded in ${tmpDir}`)
  await rename(join(tmpDir, webm), destWebm)
  await rm(tmpDir, { recursive: true, force: true })
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] })
    p.on('error', reject)
    p.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited ${code}`))
    })
  })
}

/**
 * Transcode webm → H.264 mp4 suitable for Twitter/Reddit/LinkedIn.
 *
 * Trims the first `trimLeadMs` ms (Playwright's video starts rolling on context
 * creation, which means the first ~1s is the pre-navigation blank viewport).
 */
export async function webmToMp4(src, dst, { trimLeadMs = 1000, fps = 30, crf = 20 } = {}) {
  const ss = (trimLeadMs / 1000).toFixed(3)
  // yuv420p + even dimensions + +faststart = safe for social platforms.
  await run('ffmpeg', [
    '-y',
    '-ss', ss,
    '-i', src,
    '-vf', `fps=${fps},scale=trunc(iw/2)*2:trunc(ih/2)*2`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'slow',
    '-crf', String(crf),
    '-movflags', '+faststart',
    '-an',
    dst,
  ])
}

/**
 * Transcode webm → optimized gif with palette generation.
 *
 * `width` scales the output down; -1 preserves aspect. Lower `fps` and fewer
 * `colors` shrink file size for README use. `trimLeadMs` matches webmToMp4 so
 * the first frame of the gif is content, not a blank viewport — GitHub uses
 * frame 1 as the social/OG thumbnail.
 */
export async function webmToGif(src, dst, { trimLeadMs = 1000, fps = 18, width = 800, colors = 128, crop = null } = {}) {
  const ss = (trimLeadMs / 1000).toFixed(3)
  const vf = [
    `fps=${fps}`,
    `scale=${width}:-1:flags=lanczos`,
    crop ? `crop=${crop}` : null,
    'split[a][b]',
    `[a]palettegen=max_colors=${colors}:stats_mode=diff[p]`,
    '[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
  ].filter(Boolean).join(',')
  await run('ffmpeg', [
    '-y',
    '-ss', ss,
    '-i', src,
    '-vf', vf,
    '-loop', '0',
    dst,
  ])
}

/**
 * Abort with a helpful message if the dev server isn't reachable. Saves the
 * caller from a confusing Playwright timeout deep inside `page.goto`.
 */
export async function assertDevServer(url = DEFAULT_BASE_URL) {
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (e) {
    console.error(`\nCannot reach ${url} — start the docs dev server first:\n  pnpm docs:dev\n`)
    throw e
  }
}
