<script setup lang="ts">
import {
  cloneVNode,
  Comment,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  Text,
  useAttrs,
  useSlots,
  watch,
  type VNode,
} from 'vue'
import { useInView } from 'motion-v'
import {
  AnimateIconKey,
  type Trigger,
  type TriggerTarget,
  type VariantName,
} from './context'

// See `ForwardedSlot` below for why fallthrough is opted out.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    animate?: Trigger
    animateOnHover?: Trigger
    animateOnTap?: Trigger
    animateOnView?: Trigger
    animation?: string
    persistOnAnimateEnd?: boolean
    initialOnAnimateEnd?: boolean
    /**
     * Clip overflow at the icon's viewBox — use when the active animation
     * moves parts of the icon outside its box on purpose (e.g. `send`'s plane
     * flies off-screen before returning). Default off so icons that
     * deliberately render outside their box (e.g. link-2's burst particles)
     * keep working.
     */
    clip?: boolean
    /**
     * "default"  — forward events and the viewRef onto the slot's first vnode
     *              (the icon's `<motion.svg>`). No DOM wrapper.
     * "template" — render slot content only; expose `{ on, viewRef }` so the
     *              consumer binds them to any element (e.g. a <v-btn>).
     *              Mirrors React's `asChild`.
     *
     * `"span"` is accepted as a legacy alias for `"default"`; prior versions
     * rendered an `inline-flex` span wrapper, which broke absolute-positioned
     * icon layouts (#5) — the wrapper is gone and events now live on the svg.
     */
    as?: 'default' | 'template' | 'span'
    /**
     * Ancestor element to bind hover/tap listeners to instead of the icon
     * itself. Lets you drop animation into existing `<button><Icon /></button>`
     * markup without switching to `as="template"`. Ignored in `as="template"`.
     */
    triggerTarget?: TriggerTarget
  }>(),
  {
    animate: false,
    animateOnHover: false,
    animateOnTap: false,
    animateOnView: false,
    animation: 'default',
    persistOnAnimateEnd: false,
    initialOnAnimateEnd: false,
    clip: false,
    as: 'default',
    triggerTarget: 'self',
  },
)

const current = ref<VariantName>('initial')
const animation = ref<string>(props.animation)

watch(() => props.animation, v => (animation.value = v))

function start(t: Trigger) {
  if (!t) return
  animation.value = typeof t === 'string' ? t : props.animation
  current.value = 'initial'
  // Defer one animation frame, not just a microtask. motion-v needs time to
  // mount + measure the DOM before kicking off the tween — in particular,
  // `pathLength` reads `getTotalLength()` on the motion.path, which returns
  // nothing useful until the svg is laid out. With a microtask-only defer,
  // fresh-mount animations (e.g. the drawer preview) would see scale tween
  // but pathLength silently no-op. rAF gives motion-v that first frame.
  // Still needed under motion-v 2.2.1 — confirmed 2026-04-21.
  //
  // SSR path (Nuxt, vite-ssg, …) has no rAF. Nothing visual can happen there
  // anyway — motion-v only animates client-side once mounted — so just flip
  // to the 'animate' variant directly and let client hydration replay it.
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => { current.value = 'animate' })
  } else {
    current.value = 'animate'
  }
}

function stop() {
  if (props.persistOnAnimateEnd) return
  current.value = 'initial'
}

watch(() => props.animate, t => (t ? start(t) : stop()), { immediate: true })

const viewRef = ref<HTMLElement | SVGElement | null>(null)
const setViewRef = (inst: unknown) => {
  // Component refs resolve to the component proxy; unwrap to `$el` to reach
  // the root DOM node (the icon's <motion.svg>). Element refs pass through.
  const el = (inst as { $el?: unknown } | null | undefined)?.$el ?? inst
  viewRef.value = (el as HTMLElement | SVGElement | null) ?? null
}
const isInView = useInView(viewRef, { once: false })
watch(isInView, v => {
  if (!props.animateOnView) return
  v ? start(props.animateOnView) : stop()
})

function onEnter() { if (props.animateOnHover) start(props.animateOnHover) }
function onLeave() { if (props.animateOnHover || props.animateOnTap) stop() }
function onDown()  { if (props.animateOnTap) start(props.animateOnTap) }
function onUp()    { if (props.animateOnTap) stop() }

// Icons that should loop bake `repeat: Infinity` into their own variant
// transitions — motion handles those natively. This callback only exists
// for the `initialOnAnimateEnd` hook on one-shot animations.
function notifyComplete() {
  if (current.value === 'animate' && props.initialOnAnimateEnd) {
    current.value = 'initial'
  }
}

provide(AnimateIconKey, { current, animation, notifyComplete })

// Vue 3's `v-on="obj"` uses event-name keys without the `on` prefix.
const on = {
  mouseenter: onEnter,
  mouseleave: onLeave,
  pointerdown: onDown,
  pointerup: onUp,
}
defineExpose({ on })

// Forward everything onto the slot's first vnode — the icon's <motion.svg>.
// Earlier versions wrapped the slot in an inline-flex <span> to catch events
// and host the useInView ref, but that wrapper created a line box in block
// parents that pushed absolute-positioned siblings down a line (#5). Events,
// the viewRef, and the consumer's fallthrough attrs (class/style/aria/data/
// id/events) all go onto the svg instead — matching lucide-vue-next's bare-
// svg shape.
//
// mergeProps handles the merges that matter:
//   - class/style concatenate (consumer + clip override both survive)
//   - on* handlers combine into arrays (consumer's @mouseenter still fires
//     alongside our hover trigger)
const attrs = useAttrs()
const slots = useSlots()
function ForwardedSlot(): VNode[] {
  const nodes = (slots.default?.() ?? []) as VNode[]
  const out: VNode[] = []
  let forwarded = false

  // When triggerTarget is an ancestor, don't bind listeners on the svg too —
  // otherwise moving button → icon fires both and `start()` re-resets
  // `current` mid-animation. attachExternal handles the ancestor case.
  const eventHandlers =
    props.triggerTarget === 'self'
      ? {
          onMouseenter: onEnter,
          onMouseleave: onLeave,
          onPointerdown: onDown,
          onPointerup: onUp,
        }
      : {}

  const clipStyle = props.clip ? { style: { overflow: 'hidden' } } : {}

  const extras = mergeProps(
    attrs,
    eventHandlers,
    clipStyle,
    { ref: setViewRef as any },
  )

  for (const n of nodes) {
    const renderable = n && n.type !== Comment && n.type !== Text
    if (!forwarded && renderable) {
      out.push(cloneVNode(n, extras))
      forwarded = true
    } else {
      out.push(n)
    }
  }
  return out
}

function resolveTarget(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  const el = viewRef.value
  if (!el || props.triggerTarget === 'self') return null
  if (props.triggerTarget === 'parent') return el.parentElement
  if (props.triggerTarget.startsWith('closest:')) {
    const selector = props.triggerTarget.slice('closest:'.length).trim()
    if (!selector) return null
    // Start from parentElement so the icon itself cannot self-match.
    return el.parentElement?.closest<HTMLElement>(selector) ?? null
  }
  return null
}

let attached: HTMLElement | null = null
function detachExternal() {
  if (!attached) return
  attached.removeEventListener('mouseenter', onEnter)
  attached.removeEventListener('mouseleave', onLeave)
  attached.removeEventListener('pointerdown', onDown)
  attached.removeEventListener('pointerup', onUp)
  attached = null
}
function attachExternal() {
  detachExternal()
  const el = resolveTarget()
  if (!el) return
  el.addEventListener('mouseenter', onEnter)
  el.addEventListener('mouseleave', onLeave)
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)
  attached = el
}

onMounted(attachExternal)
onBeforeUnmount(detachExternal)
watch(() => props.triggerTarget, attachExternal)

// Slot props are optional because the default branch forwards onto the
// slot's first vnode without args; consumers using `as="template"`
// destructure them explicitly.
defineSlots<{
  default?(props: {
    on?: typeof on
    viewRef?: (el: unknown) => void
  }): any
}>()
</script>

<template>
  <slot
    v-if="props.as === 'template'"
    :on="on"
    :viewRef="setViewRef"
  />
  <ForwardedSlot v-else />
</template>
