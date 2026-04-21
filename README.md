# @respeak/lucide-motion-vue

[![npm](https://img.shields.io/npm/v/@respeak/lucide-motion-vue.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@respeak/lucide-motion-vue)
[![downloads](https://img.shields.io/npm/dm/@respeak/lucide-motion-vue.svg?color=informational)](https://www.npmjs.com/package/@respeak/lucide-motion-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@respeak/lucide-motion-vue?label=min%2Bgzip)](https://bundlephobia.com/package/@respeak/lucide-motion-vue)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org)
[![types](https://img.shields.io/npm/types/@respeak/lucide-motion-vue.svg)](https://www.npmjs.com/package/@respeak/lucide-motion-vue)

**259 Lucide icons animated with [Motion for Vue](https://motion.dev/docs/vue)** — drop-in, tree-shakeable, TypeScript-first. A Vue 3 port of the animated icon set from [animate-ui](https://github.com/imskyleen/animate-ui) (React), rebuilt on `motion-v`.

[![Animated icon preview](./docs/hero.gif)](https://respeak-io.github.io/lucide-motion-vue/)

**▶︎ [Browse the live icon gallery](https://respeak-io.github.io/lucide-motion-vue/)** — hover any icon to preview; click for variants and copy-paste snippets.

- **259 icons**, tree-shakable, one chunk per icon
- Ergonomic triggers: `animateOnHover`, `animateOnTap`, `animateOnView`, or a composable `<AnimateIcon>` wrapper
- Composition API, `<script setup>`, full TypeScript types
- Native Motion loops — no hand-rolled rAF, no timers
- Color via `currentColor`, plays nicely with Tailwind / Vuetify / any design system
- Works standalone (`<Heart animateOnHover />`) or composed (`<AnimateIcon>` over anything)

## Contents

- [Install](#install)
- [Usage](#usage)
  - [Collision-safe names](#collision-safe-names)
  - [Per-icon subpath imports](#per-icon-subpath-imports)
- [Props](#props)
- [Color](#color)
- [`<AnimateIcon>` wrapper](#animateicon-wrapper)
- [Discovering variants (`iconsMeta`)](#discovering-variants-iconsmeta)
- [TypeScript](#typescript)
- [Accessibility](#accessibility)
- [Docs site](#docs-site)
- [Contributing / regenerating icons](#contributing--regenerating-icons)
- [License](#license)

## Install

```bash
pnpm add @respeak/lucide-motion-vue motion-v
```

Peer deps: `vue ^3.3`, `motion-v ^2`.

## Usage

```vue
<script setup lang="ts">
import {
  AnimateIcon,
  Heart,
  BetweenVerticalStart,
} from '@respeak/lucide-motion-vue'
</script>

<template>
  <!-- Standalone, self-wrapped -->
  <Heart animateOnHover />
  <BetweenVerticalStart animateOnTap />

  <!-- Named animation variant -->
  <Heart animateOnHover animation="fill" />

  <!-- Composed: one trigger, many children -->
  <AnimateIcon animateOnHover>
    <span>
      <BetweenVerticalStart />
      <Heart />
    </span>
  </AnimateIcon>

  <!-- Button-as-trigger (renderless, via scoped slot) -->
  <AnimateIcon animateOnHover as="template" v-slot="{ on }">
    <v-btn color="primary" v-on="on">
      <BetweenVerticalStart :size="20" class="mr-2" />
      Align columns
    </v-btn>
  </AnimateIcon>
</template>
```

### Collision-safe names

If you use this library alongside `lucide-vue-next` (static icons), both export `Heart`. Use the `*Animated` alias to disambiguate:

```ts
import { Heart as StaticHeart } from 'lucide-vue-next'
import { HeartAnimated } from '@respeak/lucide-motion-vue'
```

### Per-icon subpath imports

Every icon is also exposed under `/icons/<kebab-name>` for consumers who want guaranteed separate chunks (or whose bundler trips on large barrel files):

```ts
import Heart from '@respeak/lucide-motion-vue/icons/heart'
import BetweenVerticalStart from '@respeak/lucide-motion-vue/icons/between-vertical-start'
```

Tree-shaking works with either import style (package is ESM + `"sideEffects": false`).

## Props

Every icon accepts:

| prop                  | type                     | default  | description                                                   |
|-----------------------|--------------------------|----------|---------------------------------------------------------------|
| `size`                | `number`                 | `28`     | Rendered width/height in px.                                  |
| `strokeWidth`         | `number`                 | `2`      | SVG stroke width.                                             |
| `animate`             | `boolean \| string`      | `false`  | Programmatic trigger. Pass a variant name to select it.       |
| `animateOnHover`      | `boolean \| string`      | `false`  | Play while hovered.                                           |
| `animateOnTap`        | `boolean \| string`      | `false`  | Play while pointer is down.                                   |
| `animateOnView`       | `boolean \| string`      | `false`  | Play when the icon enters the viewport.                       |
| `animation`           | `string`                 | `default`| Which named variant group to pull from (e.g. `fill`).         |
| `persistOnAnimateEnd` | `boolean`                | `false`  | Keep final state instead of returning to `initial`.           |
| `initialOnAnimateEnd` | `boolean`                | `false`  | Force snap to `initial` when animation ends.                  |

Available `animation` names are icon-specific and mirror upstream animate-ui — e.g. `Heart` supports `default` and `fill`, `BetweenVerticalStart` supports `default` and `default-loop`, `Link2` supports `default`/`apart`/`unlink`/`link`. See [Discovering variants](#discovering-variants-iconsmeta) for a programmatic way to list them, or browse the docs site in `docs/` (`pnpm docs:dev`).

Icons that are conceptually infinite (`LoaderCircle`, `Loader`, `LoaderPinwheel`, etc.) bake `repeat: Infinity` into their own variant transitions, so they loop as soon as you trigger them — no prop required. One-shot icons play once per trigger.

## Color

Icons use `stroke="currentColor"` (and `fill: 'currentColor'` for fill-based variants), so color is driven by the parent's CSS `color` — same pattern as `lucide-vue-next`. Fill-based animations automatically pick up whatever color you set, so the tween stays on-brand.

```vue
<!-- Any of these work, including fill animations -->
<Heart animateOnHover class="text-rose-500" />
<Heart animateOnHover animation="fill" style="color: #4f46e5" />
<div style="color: var(--my-brand)"><Heart animateOnHover /></div>
```

## `<AnimateIcon>` wrapper

```ts
import { AnimateIcon } from '@respeak/lucide-motion-vue'
```

A thin wrapper that catches trigger events and propagates animation state (via `provide/inject`) to any icon nested inside. Use it when one trigger should drive multiple icons, or when the trigger element should be something other than the icon itself (button, card, link…).

### Props

All the trigger/animation props below also work directly on individual icons; the wrapper just lets you share them across a subtree.

| prop                  | type                | default   | description                                                |
|-----------------------|---------------------|-----------|------------------------------------------------------------|
| `animate`             | `boolean \| string` | `false`   | Programmatic trigger. Pass a variant name to select it.    |
| `animateOnHover`      | `boolean \| string` | `false`   | Play while hovered.                                        |
| `animateOnTap`        | `boolean \| string` | `false`   | Play while pointer is down.                                |
| `animateOnView`       | `boolean \| string` | `false`   | Play when the wrapper enters the viewport.                 |
| `animation`           | `string`            | `default` | Which named variant group to pull from.                    |
| `persistOnAnimateEnd` | `boolean`           | `false`   | Keep final state instead of returning to `initial`.        |
| `initialOnAnimateEnd` | `boolean`           | `false`   | Force snap to `initial` when animation ends.               |
| `as`                  | `'span' \| 'template'` | `'span'` | Rendering mode — see below.                              |

### Rendering modes

- **`as="span"`** (default): renders a plain `<span>` that catches the trigger events and exposes a `viewRef` for `animateOnView`. The `<span>` has `display: inline-flex` so it doesn't break flow layout.
- **`as="template"`**: renderless — exposes `{ on, viewRef }` via the default scoped slot so you can bind them to any element (e.g. a `<v-btn>`, `<a>`, `<button>`, whole card). Nothing extra in the DOM.

```vue
<!-- Span mode: icons become the visual trigger area -->
<AnimateIcon animateOnHover>
  <Heart :size="20" />
  <BetweenVerticalStart :size="20" />
</AnimateIcon>

<!-- Template mode: the button is the trigger -->
<AnimateIcon animateOnHover as="template" v-slot="{ on }">
  <button v-on="on" class="card">
    <Heart :size="20" />
    <span>Favorite</span>
  </button>
</AnimateIcon>
```

## Discovering variants (`iconsMeta`)

Every icon's kebab name, Pascal name, and full list of animation variants is exported as a plain array — handy for building custom pickers, auto-generated docs, or validation.

```ts
import { iconsMeta, type IconMeta } from '@respeak/lucide-motion-vue'

iconsMeta[0]
// → { kebab: 'accessibility', pascal: 'Accessibility', animations: ['default'] }

iconsMeta.find(m => m.pascal === 'Heart')?.animations
// → ['default', 'fill']
```

## TypeScript

First-class. The package ships `.d.ts` alongside every chunk:

- Every icon has typed props (`size`, `strokeWidth`, `animate`, `animateOnHover`, …).
- `AnimateIcon`'s props are typed the same way; `as` is a literal union.
- `IconTriggerProps` and `IconMeta` are exported for anyone building a wrapper or registry on top.
- No `any` in the public surface.

```ts
import type { IconTriggerProps, IconMeta } from '@respeak/lucide-motion-vue'
```

## Accessibility

Icons render as plain `<svg>` elements, so standard SVG a11y patterns apply:

- **Decorative** (next to text that already says the thing): add `aria-hidden="true"`.
- **Meaningful** (icon-only button, status indicator): label it via `aria-label` on the button/parent, or wrap in a `role="img"` element with an accessible name.

```vue
<button aria-label="Favorite this item">
  <Heart aria-hidden="true" animateOnHover />
</button>

<span role="img" aria-label="Loading">
  <LoaderCircle />
</span>
```

Animation is purely visual — it never changes the DOM structure or any `aria-*` state, so screen readers aren't affected by it. Respect `prefers-reduced-motion` by wrapping in a parent that toggles the icon out when the user prefers reduced motion, or falls back to `lucide-vue-next` for those users.

## Docs site

**Live:** https://respeak-io.github.io/lucide-motion-vue/

Two views:

- **Browse icons** (`/`) — searchable grid, variant picker, copy-paste snippets.
- **Read the docs** (`/#/docs`) — usage patterns with live demos: icons in buttons, variants, color, programmatic triggers, and a section for AI agents pointing at `llms.txt`.

To run locally:

```bash
pnpm docs:dev       # serve it on http://localhost:5174
pnpm docs:build     # emit static site to docs-dist/
```

Set `VITE_DOCS_BASE=/repo-name/` when building for a GitHub Pages subpath deploy.

### For AI agents

A concise machine-readable API reference is served at `/llms.txt` (and checked into `docs/public/llms.txt`). Point your agent's system prompt or repo rules at it — see the docs site's "For AI agents" section for a drop-in Cursor rule and prompt template.

## Contributing / regenerating icons

The icons in `src/icons/` are generated from the upstream animate-ui registry via `scripts/port-icons.mjs`:

```bash
node scripts/port-icons.mjs --force
```

This clones the upstream repo into `/tmp/animate-ui-upstream` on first run (shallow), then for each icon:

1. Extracts the module prelude (module-level constants, helper Variants, spring configs).
2. Extracts the `const animations = {…}` block.
3. Extracts the `IconComponent` return JSX and rewrites it to a Vue template.
4. Emits `src/icons/<kebab>.vue` using the standard SFC shape.
5. Regenerates `src/index.ts` with `Name` + `NameAnimated` exports.

When upstream adds a new icon, re-run the script — it auto-picks up new directories. Icons you've hand-edited are overwritten unless you remove `--force`.

### Adding a hand-written icon

Drop a `.vue` file in `src/icons/` matching the pattern of the existing generated files (script + scoped slot + self-wrap branch + `motion.svg` with `:variants=` bindings). `pnpm build` picks it up via the icon-entry glob in `vite.config.ts`, and re-running the codemod regenerates the barrel to include it.

## License

MIT for the framework code in `src/core/`.

Icon variants + SVG geometry are adapted from animate-ui (MIT + Commons Clause), which in turn uses SVG paths from [Lucide](https://lucide.dev) (ISC). See `LICENSE` for the full text.
