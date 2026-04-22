<script setup lang="ts">
import { onBeforeUnmount, provide, ref, watch } from 'vue'
import { useInView } from 'motion-v'
import {
  AnimateIconKey,
  resolveHoverTarget,
  type HoverTarget,
  type Trigger,
  type VariantName,
} from './context'

const props = withDefaults(
  defineProps<{
    animate?: Trigger
    animateOnHover?: Trigger
    animateOnTap?: Trigger
    animateOnView?: Trigger
    hoverTarget?: HoverTarget
    animation?: string
    persistOnAnimateEnd?: boolean
    initialOnAnimateEnd?: boolean
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
    hoverTarget: undefined,
    animation: 'default',
    persistOnAnimateEnd: false,
    initialOnAnimateEnd: false,
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
  requestAnimationFrame(() => { current.value = 'animate' })
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

// When `hoverTarget` resolves to an ancestor element, hover listeners go
// there instead of the wrapper span. The span's own @mouseenter/@mouseleave
// short-circuit the hover branch so the animation doesn't double-fire, but
// still handle tap cancellation when the pointer slides out mid-press.
const hoverOwner = ref<HTMLElement | null>(null)
function onEnter() { if (props.animateOnHover && !hoverOwner.value) start(props.animateOnHover) }
function onLeave() {
  if (props.animateOnTap) { stop(); return }
  if (props.animateOnHover && !hoverOwner.value) stop()
}
function onDown()  { if (props.animateOnTap) start(props.animateOnTap) }
function onUp()    { if (props.animateOnTap) stop() }

function onOwnerEnter() { if (props.animateOnHover) start(props.animateOnHover) }
function onOwnerLeave() { if (props.animateOnHover) stop() }

function detachOwner() {
  const el = hoverOwner.value
  if (!el) return
  el.removeEventListener('pointerenter', onOwnerEnter)
  el.removeEventListener('pointerleave', onOwnerLeave)
  hoverOwner.value = null
}

watch(
  [viewRef, () => props.hoverTarget, () => props.animateOnHover],
  ([wrapper, target, onHover]) => {
    detachOwner()
    if (!onHover || !target || target === 'self') return
    const el = resolveHoverTarget(target, wrapper)
    if (!el) return
    hoverOwner.value = el
    el.addEventListener('pointerenter', onOwnerEnter)
    el.addEventListener('pointerleave', onOwnerLeave)
  },
  { flush: 'post' },
)

onBeforeUnmount(detachOwner)

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
    style="display: inline-flex; line-height: 0;"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @pointerdown="onDown"
    @pointerup="onUp"
  >
    <slot />
  </span>
</template>
