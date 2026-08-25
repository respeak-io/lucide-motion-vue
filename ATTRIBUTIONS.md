# Attributions

Icons in this package are adapted from several upstream projects. Every
variant in `iconsMeta` carries a `source` tag so you can credit the right
project when surfacing icons in your own UI.

| `source` | Label in docs | Upstream |
|---|---|---|
| `animate-ui` | animate-ui | [github.com/imskyleen/animate-ui](https://github.com/imskyleen/animate-ui) |
| `lucide-animated` | lucide-animated | [lucide-animated.com](https://lucide-animated.com) — ported from [github.com/pqoqubbw/icons](https://github.com/pqoqubbw/icons) |
| `hand-written` | hand-written | Designed in-repo, Lucide geometry |

## animate-ui

Most icons originate here. Variants and SVG geometry are auto-ported by
`scripts/port-icons.mjs`.

- **License:** MIT + Commons Clause (see [`LICENSE`](./LICENSE))
- **Copyright:** © 2025 Skyleen
- **Commons Clause note:** You can freely use, copy, modify, and redistribute
  these icons in your own applications. You may **not** sell a product whose
  value derives substantially from the icons themselves (e.g. reselling the
  collection). The Commons Clause applies to the animate-ui variants only,
  not the rest of the package.

## lucide-animated (pqoqubbw/icons)

Selected icons — currently `archive`, `bookmark`, `trending-up`, `wind`,
`zap` — are hand-ported from [pqoqubbw/icons](https://github.com/pqoqubbw/icons),
the animated Lucide collection showcased at [lucide-animated.com](https://lucide-animated.com).

- **License:** MIT
- **Copyright:** © 2024-2026 pqoqubbw
- **What we adapt:** Motion variants (`normal` → `initial`, `animate` unchanged)
  and SVG geometry. The React wrapper (`forwardRef` + `useAnimation` + mouse
  handlers) is replaced with our `AnimateIcon` context.

## hand-written

Icons whose animation was designed for this repo rather than ported from an
upstream project. SVG geometry is still Lucide's; the motion is original work.

- **License:** MIT for the animation code; ISC for the Lucide geometry.

### Maintainers

`heart-pulse`, `rocket` (variants `default` and `launch` — the
`lucide-animated` variant on the same icon is ported from pqoqubbw/icons, not
hand-written), `siren`, `umbrella`, `wand-sparkles`.

### Community contributions

Contributed animations are `hand-written` too; the contributor holds the
copyright on the motion and licenses it to this project under MIT.

- **[Tushar Shukla](https://github.com/tusharrXop)** —
  [#10](https://github.com/respeak-io/lucide-motion-vue/pull/10):
  `bolt`, `briefcase`, `building-2`, `clock-alert`, `code`, `contact`,
  `database`, `folder`, `group`, `inbox`, `layout-template`, `library-big`,
  `megaphone`, `pen-line`, `phone`, `repeat`, `shield`, `shield-plus`,
  `square-user`, `tag`, `tags`, `toy-brick`, `user-cog`.

  Note: `shield` and `phone` resolve to the same geometry as the existing
  `shield-check` and `phone-call` at the end of their animation. Kept
  deliberately — both rest on their own Lucide silhouette and ship under
  their own name.

Hand-written SFCs carry a `// Hand-written` (or `// Hand-ported`) header
comment. Both port scripts check for this sentinel and refuse to clobber
matching files, even when invoked with `--force` — a deliberate guard so the
codemods can be re-run without regressing manual work. An icon can carry a
mix of hand-written and upstream-ported variants in a single SFC; each
variant is tracked independently in `iconsMeta` via its `source` field.

## Lucide

All SVG paths — regardless of which animation project supplied the variants —
ultimately come from [Lucide](https://lucide.dev).

- **License:** ISC
- **Copyright:** © 2022 Lucide Contributors

---

If you spot a missing or incorrect attribution, please open an issue at
[github.com/respeak-io/lucide-motion-vue](https://github.com/respeak-io/lucide-motion-vue/issues).
