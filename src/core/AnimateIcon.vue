<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { useInView } from 'motion-v'
import { AnimateIconKey, type Trigger, type VariantName } from './context'

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
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @pointerdown="onDown"
    @pointerup="onUp"
  >
    <slot />
  </span>
</template>
