# Forge — animation style guide

The single goal of this guide is to keep generated animations **above the "everything wiggles as a block"** floor. Every proposal you produce must clear the bar in this document before being shown to the maintainer.

## The bar (must clear ALL of these)

1. **Multiple elements move independently.** At least 2 of the icon's elements have non-empty `variants` with materially different motion. A `group` rotation with empty per-element variants is rejected.
2. **The motion maps to the icon's function.** A bell rings (clapper moves), a battery fills (rect grows), an airplane flies away (translates + scales), an arrow sorts (letters reorder). Generic shake/scale that ignores semantics is rejected.
3. **Phase / timing variation.** When multiple elements move, they should not all share the same `duration` and keyframe count. Either different `duration`, different number of keyframes, or staggered `delay`. Synchronous motion across all parts feels mechanical.
4. **Use motion-v's path tools when relevant.** `pathLength` (line-draw), `pathOffset` (line-trail), and multi-keyframe arrays unlock the "drawing" effect that single-axis transforms can't fake.

## Reference: GOOD ✅

### `bell.default` — clapper moves separately from bell body
```ts
{
  group: {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 20, -10, 10, -5, 3, 0],          // 7 keyframes, decaying
      transformOrigin: 'top center',
      transition: { duration: 0.9, ease: 'easeInOut' },
    },
  },
  path1: {                                          // the clapper
    initial: { x: 0 },
    animate: {
      x: [0, -6, 5, -5, 4, -3, 2, 0],               // 8 keyframes — DIFFERENT count
      transition: { duration: 1.1, ease: 'easeInOut' },  // DIFFERENT duration
    },
  },
  path2: {},                                        // bell rim — static, follows group
}
```
**Why it works:** Bell swings AND clapper independently swings — phase-offset because different `duration` and different keyframe counts. Looks physical.

### `audio-lines.default` — six lines, each its own equalizer pattern
```ts
// Six lines, each with its own y1/y2 keyframe array.
// All share duration: 1.5 + linear ease + repeat: Infinity, but keyframe values differ per line.
line1: { animate: { y1: [10, 5, 8, 6, 10], y2: [13, 18, 15, 17, 13], ... } },
line2: { animate: { y1: [6, 2, 10, 6],     y2: [17, 22, 13, 17],     ... } },
line3: { animate: { y1: [3, 6, 3, 8, 3],   y2: [21, 17, 21, 15, 21], ... } },
// ...
```
**Why it works:** Coordinated swarm — every element animates, but each with a unique pattern. Reads as "audio".

### `battery.default` — semantic state change
```ts
// Static elements: outer rect (battery body), tip path. Both rendered as plain SVG.
// One animated rect: the fill bar.
path: {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: 12, opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}
```
**Why it works:** The animation IS the function — battery filling up. Not decorative motion.

### `airplane.default` — primary action + supporting line-draw
```ts
path: {                                     // the plane
  initial: { x: 0, y: 0, scale: 1 },
  animate: { x: 3, y: -3, scale: 0.8 },     // flies away (translate + shrink)
},
path2: {                                    // 3 speed lines, mapped over template
  initial: { pathOffset: [0, 1], translateX: -3, translateY: 3, opacity: 0, ... },
  animate: { pathOffset: [1, 2], translateX: [0, 0], translateY: [0, 0], opacity: 1 },
  // 3 lines share the variant but have DIFFERENT delay: 0.1, 0.2, 0.3 → staggered
}
```
**Why it works:** Two distinct motion ideas combined — the plane translates while the speed lines draw themselves in with `pathOffset`. The staggered delays are the chef's kiss.

## Reference: BAD ❌ (rejected by the cheap-detector)

### `brush.default` — the whole icon rotates as a block
```ts
group: {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -6, 6, 0],
    transformOrigin: 'top right',
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
},
path1: {},   // empty
path2: {},   // empty
path3: {},   // empty
```
**Why it fails:** Only one variant has motion (`group`). The brush wiggles as one piece. The bristles don't bend, the handle doesn't separate from the head. Generic.

### `bell.lucide-animated` — same problem as brush, on a bell
```ts
group: {
  initial: { rotate: 0 },
  animate: { rotate: [0, -10, 10, -10, 0] },
},
path1: {},   // empty (this is the clapper — should move!)
path2: {},   // empty
```
**Why it fails:** Bell rings without the clapper moving. The clapper is right there in the SVG, untouched. Compare to `bell.default` above.

## Output schema (strict JSON)

You will produce exactly **3 proposals per icon**. Each proposal must conform to:

```ts
type Proposal = {
  title: string              // ≤ 4 words, e.g. "Wand draws stars"
  description: string        // 1-2 sentences for human review
  elements: Array<{
    tag: 'path' | 'line' | 'rect' | 'circle' | 'ellipse' | 'polyline' | 'polygon'
    attrs: Record<string, string | number>   // raw SVG attrs (d, x1, x, y, etc.)
    key?: string             // if present, animates via variants[key]; if absent, static
  }>
  variants: Record<string, {
    initial: Record<string, unknown>
    animate: Record<string, unknown>
    // values may be numbers, strings, arrays of either, or { ...with transition: {...} }
  }>
}
```

### Rules for the `elements` list

- Preserve the **original Lucide path geometry** (don't redraw shapes). You may split a single `<path>` into multiple paths if you need to animate them independently — but only along existing M-segments, never invent new geometry.
- Every `key` you reference in `variants` must appear on at least one element.
- Use plain SVG attribute names (`stroke-linecap`, not `strokeLinecap`) inside `attrs`.

### Rules for `variants`

- At least **2 keys** must have non-empty `animate`. A proposal with only one moving key will be rejected.
- Each `transition` should explicitly set `duration` and ideally `ease`. For loops, include `repeat: Infinity`.
- Prefer multi-keyframe arrays (`[0, 5, -3, 0]`) over 2-point tweens for organic motion.
- If you want phase offset between two parts, give them different `duration` or different keyframe counts.

### The 3 proposals must be DIFFERENT IDEAS, not parameter tweaks

For an icon like `wand-sparkles`:
- Proposal A: Wand tip draws a circle + sparkles pop in sequence
- Proposal B: Wand swings horizontally + sparkles emit on each peak
- Proposal C: Sparkles orbit around stationary wand tip

NOT:
- Proposal A: Wand tilts 10°
- Proposal B: Wand tilts 15°
- Proposal C: Wand tilts 20°

If you can't think of 3 genuinely distinct concepts, the icon may be a poor fit and you should say so in the description.

## Capabilities & gotchas (read before designing)

The system can express a fairly narrow band of motion-v on SVG. Knowing the band keeps you from proposing motion that won't render the way you imagine.

### Animatable on SVG via motion-v
- **Transforms** — `x, y, scale, scaleX, scaleY, rotate, skew`. Always pair `scale` or `rotate` with an explicit `transform-origin`. SVG's default origin is (0,0) of the viewport — NOT the element's center — so omitting it slides the element off-canvas instead of pivoting in place.
- **Path stroke draw** — `pathLength` (0 → 1 reveals the stroke), `pathOffset` (slides the visible segment along), `pathSpacing`. Use these on `<motion.path>` for "draw the line in" or "trail along" effects that pure transforms can't fake. See `airplane.default`'s speed lines for a pathOffset example.
- **Visual** — `opacity`, `fill`, `stroke`, `stroke-width`.
- **Per-tag** — `cx, cy, r` on circles; `width, height, x, y` on rects; `x1, x2, y1, y2` on lines. Animating these directly is often cleaner than wrapping a static rect in a `scale` transform.

### Setting `transform-origin` correctly
Use the centroid handed to you in the per-element geometry block. Two equally good places to set it:
- On the element's `style` attribute (sturdier under SSR):
  ```ts
  { tag: 'path', attrs: { d: 'M5 6v4', style: 'transform-origin: 5px 8px' }, key: 'sparkleA' }
  ```
- Inside the `animate` block as `transformOrigin`:
  ```ts
  animate: { rotate: [0, 20, 0], transformOrigin: '12px 12px', transition: { ... } }
  ```
Pick one. Don't set both — they can fight each other.

### Schema constraints that limit what you can express
- Available tags: `path, line, rect, circle, ellipse, polyline, polygon`. **No `<g>`.** To coordinate motion across multiple elements (e.g. "all three sparkles fade in together"), give them all the same `key` — they share a variant entry. Elements with the same centroid (visible in the geometry block) usually want the same key.
- `:animate` is binary: `initial` ↔ `animate`. There's no third state. If you want "settle into a different pose", land the keyframe array on that pose at the end (last value of the array is the final state).
- One template per icon — the rendered SVG always uses the element list from the variant Claude is producing. There's no per-variant template branching.

### Won't work — don't propose
- **Path morphing `d` between two paths with different anchor counts.** Motion-v will not interpolate them cleanly; you'll get a snap. If you want morphing, redesign the path so both states share the same point count.
- **Animating `viewBox`.** Not supported.
- **Gradient stroke or fill animation.** Requires `<defs>` and gradient stops the renderer doesn't emit.
- **`translateX` / `translateY` on `<motion.rect>`.** motion-v Vue leaks the rect's SVG `x` / `y` attributes into the transform translation — `<rect x="8" y="8">` with variant `{ translateX: 0, translateY: 0 }` renders at `transform: translate(8, 8)` instead of `translate(0, 0)`, doubling the offset. Use plain `x` / `y` on rects instead (variant `{ x: 0, y: 0 }` resolves to a clean transform with no leakage). `translateX` / `translateY` works fine on `<path>`, `<line>`, `<circle>`, `<polygon>` — only rects (and `<image>`, which we don't ship) are affected.

### Looping behaviour
- **One-shot** (default): set `transition: { duration, ease }`. The forge's preview UI auto-replays via SVG re-mount, so you do **not** need `repeat: Infinity` to make replay happen.
- **True continuous loop** (e.g. the equalizer in `audio-lines`, a spinner): set `repeat: Infinity` (and usually `repeatType: 'reverse'` or `'mirror'`) inside the variant's transition. Use this only when the motion is genuinely meant to be ongoing, not as a hack to make a one-shot replay.
