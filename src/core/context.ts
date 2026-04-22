import { computed, inject, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'

export type VariantName = 'initial' | 'animate'
export type Trigger = boolean | string

export interface AnimateIconContext {
  current: Ref<VariantName>
  animation: Ref<string>
  notifyComplete: () => void
}

export const AnimateIconKey: InjectionKey<AnimateIconContext> = Symbol('AnimateIcon')

export function useAnimateIconContext(): AnimateIconContext {
  const ctx = inject(AnimateIconKey, null)
  if (ctx) return ctx
  return {
    current: ref<VariantName>('initial'),
    animation: ref<string>('default'),
    notifyComplete: () => {},
  }
}

/**
 * Returns a computed ref of the active variant group (e.g. the variants
 * under `default` or `fill`). The return type is loose on purpose: variants
 * often have *different* part keys per named animation (e.g. `default:
 * { group, path }` but `open: { path }`), so the template needs to access
 * any key without TS narrowing to an intersection.
 *
 * Icons that should loop indefinitely express that in their own variant
 * transitions (`repeat: Infinity`) — see `loader-circle`, `spinner`, etc.
 * There's deliberately no user-facing `loop` prop: forcing a one-shot
 * animation to loop just produces weird UX, and the truly infinite icons
 * don't need any opt-in.
 */
export function getVariants<
  A extends { default: Record<string, any>; [k: string]: Record<string, any> }
>(animations: A): ComputedRef<Record<string, any>> {
  const { animation } = useAnimateIconContext()
  return computed(() => animations[animation.value] ?? animations.default)
}

/**
 * Which element the hover/tap listeners attach to.
 *
 * - `"self"` (default): the icon's own span wrapper — current behaviour.
 * - `"parent"`: the span's `parentElement`. Covers the common
 *   `<button><Icon /></button>` shape without restructuring markup.
 * - `` `closest:${selector}` ``: climb ancestors via `closest()` — use when
 *   the icon sits inside extra wrappers (e.g. a flex row inside the button).
 *
 * Only applies in `as="span"` (default) mode. In `as="template"` mode the
 * consumer already chooses the trigger element by binding the exposed `on`.
 */
export type TriggerTarget = 'self' | 'parent' | `closest:${string}`

export interface IconTriggerProps {
  animate?: Trigger
  animateOnHover?: Trigger
  animateOnTap?: Trigger
  animateOnView?: Trigger
  animation?: string
  persistOnAnimateEnd?: boolean
  initialOnAnimateEnd?: boolean
  size?: number
  /**
   * Clip the icon's overflow at its bounding box. Opt-in because a handful of
   * animations (send's plane flying off, rocket's launch variant lifting off,
   * etc.) read correctly *only* when parts that move outside the viewBox are
   * hidden — without clipping you see the plane tour around the page. Other
   * icons deliberately render outside their box (link-2's burst particles,
   * some lucide-animated variants) and would break if clipping were on by
   * default, so the caller decides per-use.
   */
  clip?: boolean
  triggerTarget?: TriggerTarget
}

export function hasOwnTriggers(p: IconTriggerProps): boolean {
  return (
    (p.animate !== undefined && p.animate !== false) ||
    !!p.animateOnHover ||
    !!p.animateOnTap ||
    !!p.animateOnView
  )
}
