# Changelog

All notable changes to `@respeak/lucide-motion-vue` are documented here.

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- **Self-wrap no longer emits an inline-flex `<span>` wrapper.** When an icon
  had any trigger (`animate`, `animateOnHover`, `animateOnTap`,
  `animateOnView`), `AnimateIcon` wrapped the svg in a `<span style="display:
  inline-flex; line-height: 0">`. In a block parent that span sat in the
  inline formatting context and opened an anonymous line box — so an icon
  with `position: absolute` (the standard lucide-vue-next "icon inside an
  input" overlay) still pushed its block sibling down by ~1em. Events, the
  `useInView` ref, `clip`, and consumer fallthrough attrs now forward onto
  the slot's first vnode (the `<motion.svg>`) via `cloneVNode` + `mergeProps`
  instead. Matches the bare-svg shape of `lucide-vue-next`. Thanks
  @FAbrahamDev (#5).

### Changed
- `<AnimateIcon>`'s `as` prop renamed `'span'` → `'default'` to reflect the
  new wrapperless behaviour; `'span'` is still accepted as a silent alias so
  existing markup keeps compiling.

## [0.4.2] - 2026-04-26

### Fixed
- **`Facebook` icon now scales correctly at sizes other than ~24px.** Upstream
  pqoqubbw shipped the icon's `<svg>` without a `viewBox`, so the SVG used
  `width`/`height` as its implicit user-coordinate space. The path coords
  (0–24) only filled the canvas when `size` happened to land near 24; at
  `:size="48"` the icon rendered at half-size anchored top-left, at 128 it
  shrank to a corner glyph. Added `viewBox="0 0 24 24"` and patched
  `port-pqoqubbw-icons.mjs` to inject a `viewBox` defensively when an
  upstream icon ships without one, so a future regen can't silently revert it.

### Internal
- Added a layered test suite — Vitest unit (`AnimateIcon` triggers, context
  helpers, generator structural shape, an all-icons smoke render) and
  Playwright e2e (consumer interaction idioms) — wired into a GitHub Actions
  CI workflow with parallel typecheck / build / unit / e2e jobs. No public
  API change; package surface published to npm is unchanged.

## [0.4.1] - 2026-04-23

### Fixed
- **`class` and `style` now reach the inner `<motion.svg>` when an icon
  self-wraps.** Previously, setting any trigger (`animate`, `animateOnHover`,
  `animateOnTap`, `animateOnView`) made the icon render as
  `<AnimateIcon><Icon /></AnimateIcon>`, and Vue's default attribute
  fallthrough sent the consumer's `class`/`style` to `AnimateIcon`'s `<span>`
  wrapper instead of the SVG. CSS-based sizing (`<Heart class="w-6 h-6"
  animateOnHover />`, the idiom `lucide-vue-next` users carry over) silently
  broke. `<AnimateIcon>` is now `inheritAttrs: false` and forwards fallthrough
  attrs (class, style, events, aria, data-*) onto the slot's first vnode via
  `cloneVNode`. No icon-SFC changes; the static path (`<Heart class="w-6
  h-6" />` without triggers) was already correct and is unaffected.
  Minor behavior change: `id`, `aria-*`, and event handlers on self-wrapped
  icons now land on the `<svg>` instead of the `<span>` wrapper — the old
  placement was a side effect of the same bug. Thanks @FAbrahamDev (#4).

### Changed
- Docs section `Color` renamed to `Styling` and gained a "Sizing via CSS"
  subsection. Deep-links to `#color` become `#styling`.

## [0.4.0] - 2026-04-22

### Added
- **+86 icons gain a `lucide-animated` variant, +19 new numbered-sibling icons** imported from [pqoqubbw/icons](https://github.com/pqoqubbw/icons). Existing icons whose upstream counterpart shares the same shape get a new variant you can pick via `animation="lucide-animated"`; icons whose upstream shape genuinely differs (e.g. `send`'s swoosh vs. the original paper-plane) ship as siblings — `Send2`, `Moon2`, `X2`, `AlarmClock2`, etc. — so both the existing animation and the pqoqubbw design stay available. Every new variant carries its `source: 'lucide-animated'` tag in `iconsMeta`.
- **`triggerTarget` prop** on every icon and on `<AnimateIcon>` — binds hover/tap listeners to an ancestor element instead of the icon's own span wrapper. Accepts `'self'` (default), `'parent'`, or `` `closest:${selector}` ``. Lets you drop animation into existing `<button><Icon /></button>` markup without restructuring to `as="template"` (`<Heart animateOnHover triggerTarget="parent" />`). `as="template"` is still the right tool when one trigger should drive several icons. Exported as type `TriggerTarget` for wrapper authors. New "Migrating existing buttons" section in the README and the docs `Buttons` page.
- **Nuxt module** at `@respeak/lucide-motion-vue/nuxt` — auto-registers `<AnimateIcon>` and every icon with an `Animated` suffix by default (`<HeartAnimated>`, `<Link2Animated>`, …), so the library coexists with `lucide-vue-next`'s static `<Heart>` without collisions. Naming is configurable via the `lucideMotion` key in `nuxt.config`. Per-icon tree-shaking is preserved.
- **`clip` prop** on every icon and on `<AnimateIcon>`. Opt-in boolean that hides overflow at the wrapper's box — use it for animations that deliberately move parts off-screen (`<SendAnimated animateOnHover clip />`, rocket's `launch` variant, etc.). Off by default so icons that render outside their box on purpose (`Link2`'s burst particles, some `lucide-animated` variants) keep working.
- Docs playground now has a `clip` toggle and emits the prop in the generated snippet. New "Clipping overflow" subsection on the Props page with a side-by-side `Send` demo.

### Fixed
- **SSR safety**: `<AnimateIcon>` no longer throws `requestAnimationFrame is not defined` when rendered server-side (Nuxt, vite-ssg) with a truthy `animate` prop. Client hydration still gets the deferred animation frame.
- Docs site: the `#clip-demo` link in the Props table no longer bounces you back to the browse view (the hash router treated the anchor as an unknown route). It now scrolls directly to the subsection without rewriting the URL hash.

## [0.3.2] - 2026-04-21

### Fixed
- `calendar-days` now renders its dot overlay correctly (unused `AnimatePresence` import was breaking the template).
- `<Link2>` burst particles pivot from the correct origin under CSS `transform-box: view-box` — previous behavior drifted when the icon was scaled via a parent transform.
- Drawer preview enforces a 190px minimum height so the icon doesn't collapse on narrow viewports.

### Changed
- Hero GIF on the README is cropped tighter + captures more motion frames; added a variants-preview GIF for the docs site.

## [0.3.0] - 2026-04-17

### Added
- **Interactive Playground** tab in the docs site — live icon preview, searchable picker, prop knobs (trigger, variant, size, stroke, color, persist), and a copy-paste snippet that mirrors current state.
- **"In context" drawer row** — each icon's detail drawer now shows the icon at 16 / 24 / 32 px plus two shadcn-style button samples (primary, outline) so you can see how it reads at real UI scales.
- **`rocket` icon** gains a `lucide-animated` variant via the new `--augment=<kebab>` flow on the pqoqubbw port script — lets hand-written icons grow upstream variants without losing their originals.

## [0.2.0] - 2026-04-09

### Added
- **+253 icons from `lucide-animated`** (pqoqubbw/icons) in three passes — standard, inline-variants, and stray-JSX shapes. Every variant now carries a `source` tag (`animate-ui` / `lucide-animated` / `hand-written`) for per-variant attribution (see `iconsMeta`).
- Favicons wired into the docs site.

### Fixed
- Default SVG `overflow` is now `visible` so animations can draw past the 24×24 viewBox without being clipped. (This is the pre-`clip`-prop behavior; the new `clip` opt-in in the upcoming release reintroduces clipping for specific exit animations.)

## [0.1.1] - 2026-03-28

### Added
- First public release. 259 animated icons ported from [animate-ui](https://github.com/imskyleen/animate-ui) to Vue 3 on [Motion for Vue](https://motion.dev/docs/vue).
- `<AnimateIcon>` wrapper with `animateOnHover` / `animateOnTap` / `animateOnView` triggers and a composable template mode.
- Tree-shakable barrel + per-icon subpath imports (`@respeak/lucide-motion-vue/icons/<kebab>`).
- Docs site with icon gallery, search, and keyboard navigation.

[Unreleased]: https://github.com/respeak-io/lucide-motion-vue/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/respeak-io/lucide-motion-vue/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/respeak-io/lucide-motion-vue/compare/v0.3.0...v0.3.2
[0.3.0]: https://github.com/respeak-io/lucide-motion-vue/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/respeak-io/lucide-motion-vue/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/respeak-io/lucide-motion-vue/releases/tag/v0.1.1
