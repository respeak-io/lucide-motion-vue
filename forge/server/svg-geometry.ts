/**
 * Compute per-element geometry (centroid + bbox) from a Lucide source SVG so
 * the prompt can hand Claude exact numbers for `transformOrigin` instead of
 * letting it guess. Most "scale rotates off-screen" failures trace back to
 * Claude inventing an origin that doesn't match the path's real center.
 *
 * The path parser tracks endpoints only (it's a "loose bbox" approximation —
 * it skips Bezier control points and arc extrema). For Lucide's mostly-line
 * geometry that's tight enough; for icons with big arcs the bbox runs a few
 * units small but the centroid stays usable.
 */

export interface ElementGeometry {
  index: number
  tag: 'path' | 'line' | 'rect' | 'circle' | 'ellipse' | 'polyline' | 'polygon'
  /** Verbatim attrs from the source — handy for the prompt's "d=..." snippet. */
  attrs: Record<string, string>
  bbox: { x: number; y: number; w: number; h: number }
  centroid: { x: number; y: number }
}

export function extractElements(svg: string): ElementGeometry[] {
  const out: ElementGeometry[] = []
  // Match every leaf element we care about. Self-closing or with explicit close
  // doesn't matter — we don't read the body.
  const tagRe = /<(path|line|rect|circle|ellipse|polyline|polygon)\b([^>]*)\/?>/gi
  let m: RegExpExecArray | null
  let i = 0
  while ((m = tagRe.exec(svg)) !== null) {
    const tag = m[1].toLowerCase() as ElementGeometry['tag']
    const attrs = parseAttrs(m[2])
    const geom = geometryFor(tag, attrs)
    if (geom) {
      out.push({ index: i, tag, attrs, ...geom })
      i++
    }
  }
  return out
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"|([a-zA-Z][\w:-]*)\s*=\s*'([^']*)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const key = (m[1] ?? m[3])
    const val = (m[2] ?? m[4])
    out[key] = val
  }
  return out
}

function geometryFor(
  tag: ElementGeometry['tag'],
  attrs: Record<string, string>,
): { bbox: ElementGeometry['bbox']; centroid: ElementGeometry['centroid'] } | null {
  switch (tag) {
    case 'path': {
      if (!attrs.d) return null
      const { endpoints, extras } = parsePathAnchors(attrs.d)
      if (endpoints.length === 0) return null
      // Centroid from endpoint anchors only: phantom bulge midpoints (we add
      // both perpendiculars on arcs since we don't resolve sweep) would skew
      // the centroid horizontally. Endpoints give a closer "visual middle".
      const centroid = centerOf(endpoints)
      // Bbox from endpoints + curve extras: catches arc bulge so `base` is
      // accurate for organic shapes like flame/droplet/leaf.
      const bbox = bboxOf([...endpoints, ...extras])
      return { bbox, centroid }
    }
    case 'line': {
      const x1 = num(attrs.x1), y1 = num(attrs.y1)
      const x2 = num(attrs.x2), y2 = num(attrs.y2)
      return summarize([{ x: x1, y: y1 }, { x: x2, y: y2 }])
    }
    case 'rect': {
      const x = num(attrs.x), y = num(attrs.y)
      const w = num(attrs.width), h = num(attrs.height)
      return {
        bbox: { x, y, w, h },
        centroid: { x: x + w / 2, y: y + h / 2 },
      }
    }
    case 'circle': {
      const cx = num(attrs.cx), cy = num(attrs.cy), r = num(attrs.r)
      return {
        bbox: { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r },
        centroid: { x: cx, y: cy },
      }
    }
    case 'ellipse': {
      const cx = num(attrs.cx), cy = num(attrs.cy)
      const rx = num(attrs.rx), ry = num(attrs.ry)
      return {
        bbox: { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry },
        centroid: { x: cx, y: cy },
      }
    }
    case 'polyline':
    case 'polygon': {
      const pts = parsePoints(attrs.points ?? '')
      if (pts.length === 0) return null
      return summarize(pts)
    }
  }
}

function num(v: string | undefined): number {
  if (v === undefined) return 0
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function summarize(pts: { x: number; y: number }[]) {
  return { bbox: bboxOf(pts), centroid: centerOf(pts) }
}

function bboxOf(pts: { x: number; y: number }[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function centerOf(pts: { x: number; y: number }[]) {
  const b = bboxOf(pts)
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

function parsePoints(s: string): { x: number; y: number }[] {
  const nums = (s.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? []).map(Number)
  const out: { x: number; y: number }[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    out.push({ x: nums[i], y: nums[i + 1] })
  }
  return out
}

/**
 * Walk an SVG `d` string and accumulate points that bound the path:
 *
 * - Endpoints of every command (always)
 * - Bezier control points for `C/c/S/s/Q/q/T/t` (always inside or on the
 *   curve's convex hull, so adding them gives a never-too-small bbox)
 * - Arc-bulge midpoints for `A/a` — the chord midpoint offset perpendicularly
 *   by the effective radius, in BOTH perpendicular directions. We don't
 *   resolve sweep/large-arc to pick the correct side — including both
 *   gives a slightly roomy bbox in one axis but never an undershoot, which
 *   matters more for things like `base=(cx, bbox.bottom)` than tightness.
 *
 * For Lucide's geometry this gives bbox accurate to within ~1 unit of the
 * visual bbox, which is what matters for `transform-origin` guidance.
 */
function parsePathAnchors(d: string): {
  endpoints: { x: number; y: number }[]
  extras: { x: number; y: number }[]
} {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? []
  const endpoints: { x: number; y: number }[] = []
  const extras: { x: number; y: number }[] = []

  let cx = 0, cy = 0
  let startX = 0, startY = 0
  let lastCmd = ''
  let i = 0

  while (i < tokens.length) {
    let cmd: string
    const tok = tokens[i]
    if (/[a-zA-Z]/.test(tok)) {
      cmd = tok
      i++
    } else {
      cmd = implicitNext(lastCmd)
      if (!cmd) break
    }
    lastCmd = cmd

    const lc = cmd.toLowerCase()
    const isRel = cmd === lc

    if (lc === 'z') {
      cx = startX
      cy = startY
      endpoints.push({ x: cx, y: cy })
      continue
    }

    const argCount = ARG_COUNT[lc]
    if (!argCount) break
    if (i + argCount > tokens.length) break

    const args = tokens.slice(i, i + argCount).map(Number)
    i += argCount

    if (lc === 'c') {
      extras.push(absXY(cx, cy, args[0], args[1], isRel))
      extras.push(absXY(cx, cy, args[2], args[3], isRel))
    } else if (lc === 's' || lc === 'q') {
      extras.push(absXY(cx, cy, args[0], args[1], isRel))
    }

    let nx = cx, ny = cy
    if (lc === 'h') {
      nx = isRel ? cx + args[0] : args[0]
    } else if (lc === 'v') {
      ny = isRel ? cy + args[0] : args[0]
    } else {
      const ex = args[argCount - 2]
      const ey = args[argCount - 1]
      nx = isRel ? cx + ex : ex
      ny = isRel ? cy + ey : ey
    }

    if (lc === 'a') {
      const rx = Math.abs(args[0])
      const ry = Math.abs(args[1])
      const dx = nx - cx
      const dy = ny - cy
      const chordLen = Math.hypot(dx, dy)
      if (chordLen > 0) {
        const effR = Math.max(rx, ry, chordLen / 2)
        const midX = (cx + nx) / 2
        const midY = (cy + ny) / 2
        const px = -dy / chordLen
        const py = dx / chordLen
        extras.push({ x: midX + px * effR, y: midY + py * effR })
        extras.push({ x: midX - px * effR, y: midY - py * effR })
      }
    }

    if (lc === 'm') {
      startX = nx
      startY = ny
    }

    cx = nx
    cy = ny
    endpoints.push({ x: cx, y: cy })
  }

  return { endpoints, extras }
}

function absXY(curX: number, curY: number, x: number, y: number, isRel: boolean) {
  return isRel ? { x: curX + x, y: curY + y } : { x, y }
}

const ARG_COUNT: Record<string, number> = {
  m: 2, l: 2, t: 2,
  h: 1, v: 1,
  c: 6, s: 4, q: 4,
  a: 7,
  z: 0,
}

function implicitNext(cmd: string): string {
  if (cmd === 'M') return 'L'
  if (cmd === 'm') return 'l'
  return cmd
}

/**
 * Format the geometry block that goes into Claude's user prompt. Numbers
 * are rounded to 2dp to keep the block compact; that's plenty of precision
 * for `transform-origin` on a 24×24 viewBox.
 */
export function formatGeometryBlock(elements: ElementGeometry[]): string {
  if (elements.length === 0) return '(no geometric elements found in source SVG)'
  const lines = elements.map(e => {
    const c = `(${fmt(e.centroid.x)}, ${fmt(e.centroid.y)})`
    // Base = bottom-center of the bbox. Use this for "anchor at the base"
    // recipes (breathe / sway / grow). Centroid is the visual middle, base
    // is where a flame/plant/candle/lamp sits — animations anchored here
    // read as physically grounded instead of floating.
    const baseY = e.bbox.y + e.bbox.h
    const base = `(${fmt(e.centroid.x)}, ${fmt(baseY)})`
    const b = `(${fmt(e.bbox.x)} ${fmt(e.bbox.y)}, ${fmt(e.bbox.w)}×${fmt(e.bbox.h)})`
    const desc = describeAttrs(e)
    return `  [${e.index}] ${e.tag.padEnd(8)} centroid=${c.padEnd(16)} base=${base.padEnd(16)} bbox=${b.padEnd(26)} ${desc}`
  })
  return lines.join('\n')
}

function fmt(n: number): string {
  // Trim trailing zeros: 12.00 → 12, 12.50 → 12.5
  return Number(n.toFixed(2)).toString()
}

function describeAttrs(e: ElementGeometry): string {
  switch (e.tag) {
    case 'path': return `d="${truncate(e.attrs.d ?? '', 60)}"`
    case 'line': return `(${e.attrs.x1},${e.attrs.y1})→(${e.attrs.x2},${e.attrs.y2})`
    case 'rect': return `${e.attrs.width}×${e.attrs.height} at (${e.attrs.x},${e.attrs.y})`
    case 'circle': return `r=${e.attrs.r} at (${e.attrs.cx},${e.attrs.cy})`
    case 'ellipse': return `rx=${e.attrs.rx} ry=${e.attrs.ry} at (${e.attrs.cx},${e.attrs.cy})`
    case 'polyline':
    case 'polygon': return `points="${truncate(e.attrs.points ?? '', 60)}"`
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}
