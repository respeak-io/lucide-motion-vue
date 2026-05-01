/**
 * Data-driven element shapes consumed by `<MultiVariantIcon>`. Hand-templated
 * icons (the bulk of the library) don't use these — they declare elements
 * inline in their `<motion.svg>` template. These types matter when an icon
 * carries variants whose silhouettes diverge: forge generates a thin SFC
 * delegating to `<MultiVariantIcon>` and passing the per-variant element
 * graph as data.
 */
import type { Variants } from 'motion-v'

export type SvgTag =
  | 'path'
  | 'line'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'polyline'
  | 'polygon'

export interface SvgElement {
  tag: SvgTag
  /** Plain SVG attribute names: `d`, `x1`, `stroke-linecap`, etc. */
  attrs: Record<string, string | number>
  /**
   * If present, this element animates via `variants[key]` for the active
   * animation. Absent = static element.
   */
  key?: string
  /**
   * Optional flubber morph chain. When present (and length ≥ 2), the
   * element renders through `<MorphPath>` instead of `motion.path`, with
   * the variant transition driving the silhouette interpolation.
   */
  paths?: string[]
}

/**
 * One named animation variant. The element graph (silhouette) is per-name
 * — variants that share shapes can use the same array; those that diverge
 * carry their own.
 */
export interface AnimationDef {
  elements: SvgElement[]
  variants: Record<string, Variants>
}

/**
 * A multi-variant icon's full animation map. Keys are variant names users
 * pass via the `animation` prop. `default` is conventional but not
 * mandatory — `<MultiVariantIcon>` falls back to the first entry if the
 * requested name isn't in the map.
 */
export type MultiVariantAnimations = Record<string, AnimationDef>
