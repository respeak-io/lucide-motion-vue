<script setup lang="ts">
/**
 * Morphing path. Takes a chain of `d` strings and animates the path's
 * silhouette by interpolating between them via flubber. Drives the morph
 * progress as a regular variant (`progress: 0 → 1`) so it composes with
 * the rest of the icon's variant system.
 *
 * Why flubber instead of motion-v's native `d` tween: flubber resamples
 * the source/target paths to a common command count, so chains of `d`s
 * with different anchor counts still interpolate cleanly. Motion-v's
 * built-in `d` interpolation requires matching command structure and
 * snaps when it doesn't get it.
 *
 * Bundle: flubber is pulled in only by icons that import this component
 * (per-icon chunking), so consumers who don't use morphing pay nothing.
 */
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
// flubber's ESM entry (`index.js`) only exposes named exports — no default.
// Vite resolves the `module` field, so a default import 404s at runtime.
import { interpolate as flubberInterpolate } from 'flubber'

const props = withDefaults(
  defineProps<{
    /** Two or more `d` strings; the first is the resting state. */
    paths: string[]
    /** Variant set, same shape as any motion.path receives. */
    variants?: Variants
    /** Active variant name — typically `'initial' | 'animate'`. */
    animate?: string
    /** Initial variant name. Almost always `'initial'`. */
    initial?: string
    /** Forwarded to inner motion.path for completion handlers. */
    onAnimationComplete?: () => void
  }>(),
  { initial: 'initial' },
)

defineEmits<{
  animationComplete: []
}>()

// Interpolators between consecutive path pairs. With `paths = [d0, d1, d2]`
// we get [interp(d0,d1), interp(d1,d2)]. The progress variant covers
// [0, paths.length - 1], so each unit segment of progress maps to one
// interpolator's [0, 1] domain.
const interpolators = computed(() => {
  const out: Array<(t: number) => string> = []
  for (let i = 0; i < props.paths.length - 1; i++) {
    out.push(flubberInterpolate(props.paths[i], props.paths[i + 1], { maxSegmentLength: 0.5 }))
  }
  return out
})

// Inject `progress` into both ends of the variant set so motion-v animates
// it like any other prop. We add it on top of whatever the caller passed in
// — caller can still set duration/ease/repeat/etc. on the same variant.
const segments = computed(() => Math.max(props.paths.length - 1, 1))
// `progress` is a custom motion value (not a DOM attribute) — motion-v
// animates any numeric prop and exposes its value via `onUpdate`. We can't
// type it strictly under motion-v's `Variants` because it's not a known
// transform/SVG key, so we widen to `Record<string, any>` here. The
// existing icon SFCs do the same via `getVariants`'s `Record<string, any>`
// return type.
const wrappedVariants = computed<Record<string, any>>(() => {
  const base = (props.variants ?? {}) as Record<string, Record<string, unknown>>
  return {
    initial: { ...(base.initial ?? {}), progress: 0 },
    animate: { ...(base.animate ?? {}), progress: segments.value },
  }
})

// Compute the rendered `d` string from the current progress. We can't read
// the motion value out of motion-v variants synchronously here, so we drive
// `d` via a small `<motion.path>` wrapper that animates `progress` as a
// custom value, mirrored into a Vue ref via `onUpdate`.
const progress = computed({
  get: () => internalProgress.value,
  set: (v) => { internalProgress.value = v },
})

import { ref } from 'vue'
const internalProgress = ref(0)

const renderedD = computed(() => {
  const total = interpolators.value.length
  if (total === 0) return props.paths[0] ?? ''
  const v = Math.max(0, Math.min(progress.value, total))
  const i = Math.min(Math.floor(v), total - 1)
  const frac = v - i
  return interpolators.value[i](frac)
})

function onUpdate(latest: { progress?: number }) {
  if (typeof latest.progress === 'number') internalProgress.value = latest.progress
}
</script>

<template>
  <!--
    The motion.path drives the `progress` variant numerically; we read it via
    onUpdate and recompute the actual `d` string. The path's `d` binding is a
    plain Vue computed because flubber's interpolation isn't expressible as a
    motion-v transform.
  -->
  <motion.path
    :d="renderedD"
    :variants="wrappedVariants"
    :initial="initial"
    :animate="animate"
    :on-update="onUpdate"
    @animation-complete="$emit('animationComplete')"
  />
</template>
