import { computed, inject, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'

export type VariantName = 'initial' | 'animate'
export type Trigger = boolean | string

/**
 * Where to listen for the `animateOnHover` pointer events. Default is `'self'`
 * — the icon's own bounding box. When you want the whole button / card / link
 * that *contains* the icon to be the trigger, point at an ancestor instead.
 *
 * - `'parent'`: the icon's immediate parent element.
 * - `` `closest:${selector}` ``: the nearest ancestor matching a CSS selector,
 *   e.g. `'closest:button, a, [role="button"]'`.
 * - `HTMLElement` | `Ref<HTMLElement | null>`: an explicit element or template
 *   ref. Useful when the trigger isn't an ancestor (e.g. a sibling label).
 */
export type HoverTarget =
  | 'self'
  | 'parent'
  | `closest:${string}`
  | HTMLElement
  | Ref<HTMLElement | null>

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

export interface IconTriggerProps {
  animate?: Trigger
  animateOnHover?: Trigger
  animateOnTap?: Trigger
  animateOnView?: Trigger
  /**
   * Element whose hover drives `animateOnHover`. Defaults to the icon itself.
   * Most useful as `"parent"` to let a surrounding button own the hover area
   * without an extra `<AnimateIcon as="template">` wrapper. Has no effect if
   * `animateOnHover` is falsy.
   */
  hoverTarget?: HoverTarget
  animation?: string
  persistOnAnimateEnd?: boolean
  initialOnAnimateEnd?: boolean
  size?: number
}

export function hasOwnTriggers(p: IconTriggerProps): boolean {
  return (
    (p.animate !== undefined && p.animate !== false) ||
    !!p.animateOnHover ||
    !!p.animateOnTap ||
    !!p.animateOnView
  )
}

/**
 * Resolve a {@link HoverTarget} against a wrapper element to the concrete
 * HTMLElement to attach listeners on. Returns `null` when the target is
 * `'self'`, unset, or can't be resolved against the current DOM.
 */
export function resolveHoverTarget(
  target: HoverTarget | undefined,
  wrapper: HTMLElement | null,
): HTMLElement | null {
  if (!target || target === 'self') return null
  if (target instanceof HTMLElement) return target
  if (typeof target === 'object' && 'value' in target) {
    const v = target.value
    return v instanceof HTMLElement ? v : null
  }
  if (!wrapper) return null
  if (target === 'parent') return wrapper.parentElement
  if (typeof target === 'string' && target.startsWith('closest:')) {
    const selector = target.slice('closest:'.length).trim()
    if (!selector) return null
    // closest() walks up from the element itself, which is fine here — the
    // wrapper span is an inline-flex shim and won't match real selectors.
    return wrapper.parentElement?.closest<HTMLElement>(selector) ?? null
  }
  return null
}
