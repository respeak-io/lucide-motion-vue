<script setup lang="ts">
import {
  cloneVNode,
  Comment,
  computed,
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
     * Clip overflow at the span's box — use when the active animation moves
     * parts of the icon outside its viewBox on purpose (e.g. `send`'s plane
     * flies off-screen before returning). Default off so icons that
     * deliberately render outside their box (e.g. link-2's burst particles)
     * keep working.
     */
    clip?: boolean
    /**
     * "span"     — render a <motion.span> wrapper that catches events (default).
     * "template" — render slot content only; expose `{ on, viewRef }` so the
     *              consumer binds them to any element (e.g. a <v-btn>).
     *              Mirrors React's `asChild`.
     */
    as?: 'span' | 'template'
    /**
     * Ancestor element to bind hover/tap listeners to instead of the span
     * wrapper. Lets you drop animation into existing `<button><Icon /></button>`
     * markup without switching to `as="template"`. Only applies in `as="span"`.
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
    as: 'span',
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

const viewRef = ref<HTMLElement | null>(null)
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

// Forward fallthrough attrs onto the first element-like vnode of our default
// slot. Icons that self-wrap (any trigger prop set) render
// `<AnimateIcon><Icon /></AnimateIcon>`, so without this the user's `class`
// and `style` would land on the span wrapper instead of the inner
// <motion.svg> — silently breaking the lucide-vue-next idiom of sizing via
// CSS utility classes (`w-6 h-6`, `.icon { width: 1em }`). We also forward
// events / aria / id / data-* so `@click`, `aria-label`, etc. continue to
// work — they would otherwise be dropped entirely under inheritAttrs:false.
// cloneVNode merges class and style rather than overwriting, so explicit
// bindings on the slotted vnode win.
const attrs = useAttrs()
const slots = useSlots()
function ForwardedSlot(): VNode[] {
  const nodes = (slots.default?.() ?? []) as VNode[]
  if (Object.keys(attrs).length === 0) return nodes
  const out: VNode[] = []
  let forwarded = false
  for (const n of nodes) {
    const renderable = n && n.type !== Comment && n.type !== Text
    if (!forwarded && renderable) {
      out.push(cloneVNode(n, attrs))
      forwarded = true
    } else {
      out.push(n)
    }
  }
  return out
}

// When `triggerTarget !== 'self'`, hand listener duty off to the resolved
// ancestor element. We must *also* drop them from the span, otherwise moving
// between button → icon fires both and `start()` re-resets `current` mid-
// animation.
const selfListeners = computed(() => (props.triggerTarget === 'self' ? on : {}))

function resolveTarget(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  const span = viewRef.value
  if (!span || props.triggerTarget === 'self') return null
  if (props.triggerTarget === 'parent') return span.parentElement
  if (props.triggerTarget.startsWith('closest:')) {
    const selector = props.triggerTarget.slice('closest:'.length).trim()
    if (!selector) return null
    // Start from parentElement so the span itself cannot self-match.
    return span.parentElement?.closest<HTMLElement>(selector) ?? null
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

// Slot props are optional because the `as="span"` branch emits <slot />
// without args; consumers using `as="template"` destructure them explicitly.
defineSlots<{
  default?(props: {
    on?: typeof on
    viewRef?: (el: HTMLElement | null) => void
  }): any
}>()
</script>

<template>
  <slot
    v-if="props.as === 'template'"
    :on="on"
    :viewRef="(el: any) => (viewRef = el)"
  />

  <!--
    Plain <span> (not motion.span): a motion-component wrapper with no
    variants otherwise participates in motion-v's parent→child variant
    propagation and was breaking nested pathLength animations on descendants
    (e.g. fingerprint pulsating-only when selfWrap was active). We only need
    this element for event capture + useInView, neither of which require it
    to be animated itself.
  -->
  <span
    v-else
    ref="viewRef"
    :style="{
      display: 'inline-flex',
      lineHeight: 0,
      overflow: clip ? 'hidden' : undefined,
    }"
    v-on="selfListeners"
  >
    <ForwardedSlot />
  </span>
</template>
