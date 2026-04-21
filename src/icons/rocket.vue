<script setup lang="ts">
// Hand-written (not auto-generated from upstream) — see README "Adding a hand-written icon".
// SVG geometry from Lucide (ISC). Animation designed in-repo.
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'
import {
  getVariants,
  hasOwnTriggers,
  useAnimateIconContext,
  type IconTriggerProps,
} from '../core/context'

const props = withDefaults(
  defineProps<IconTriggerProps & { strokeWidth?: number }>(),
  { size: 28, strokeWidth: 2 },
)

// Keyframe schedule shared by the group lift and the flame burst so the
// brightest flame frame lines up with peak velocity.
// 0.00 rest → 0.10 rumble-1 → 0.20 rumble-2 → 0.55 launch peak (up-right,
// along the rocket axis) → 0.80 return overshoot → 1.00 rest.
const liftoffTimes = [0, 0.1, 0.2, 0.55, 0.8, 1]
const liftoffDuration = 1.3

const animations = {
  default: {
    group: {
      initial: { x: 0, y: 0, rotate: 0 },
      animate: {
        // Rocket points up-right in Lucide, so launch travels along that
        // axis: +x, -y. Small pre-launch shake, bold lift, soft settle.
        x: [0, -0.8, 0.8, 4, -1, 0],
        y: [0, 0.4, -0.4, -10, 2.5, 0],
        rotate: [0, -2.5, 2.5, -6, 2, 0],
        transition: {
          duration: liftoffDuration,
          times: liftoffTimes,
          ease: [0.2, 0.6, 0.2, 1],
        },
      },
    },
    // right fin
    path1: {},
    // flame — ignition + sustained burn during lift, fade back at rest.
    // transformOrigin uses fill-box, so values are relative to the flame's
    // own bbox — '50% 100%' keeps the base planted, scaling upward.
    path2: {
      initial: { scale: 1, opacity: 1 },
      animate: {
        scale: [1, 1.15, 1.2, 1.7, 1.1, 1],
        opacity: [1, 1, 1, 0.85, 0.95, 1],
        transformOrigin: '50% 100%',
        transition: {
          duration: liftoffDuration,
          times: liftoffTimes,
          ease: 'easeInOut',
        },
      },
    },
    // body
    path3: {},
    // left fin
    path4: {},
  } satisfies Record<string, Variants>,

  // Send-style launch: rocket shoots off along its axis and returns.
  launch: {
    group: {
      initial: { x: 0, y: 0, scale: 1, rotate: 0 },
      animate: {
        scale: [1, 0.9, 1, 1, 1],
        x: [0, -2, '120%', '-140%', 0],
        y: [0, 2, '-120%', '140%', 0],
        rotate: [0, -6, 0, 0, 0],
        transition: {
          default: { ease: 'easeInOut', duration: 1.2 },
          x: { ease: 'easeInOut', duration: 1.2, times: [0, 0.2, 0.5, 0.5, 1] },
          y: { ease: 'easeInOut', duration: 1.2, times: [0, 0.2, 0.5, 0.5, 1] },
        },
      },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {},
  } satisfies Record<string, Variants>,
} satisfies Record<string, Record<string, Variants>>

const variants = getVariants(animations)
const { current, notifyComplete } = useAnimateIconContext()
const selfWrap = computed(() => hasOwnTriggers(props))
</script>

<template>
  <AnimateIcon
    v-if="selfWrap"
    :animate="props.animate"
    :animateOnHover="props.animateOnHover"
    :animateOnTap="props.animateOnTap"
    :animateOnView="props.animateOnView"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <Rocket :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <motion.g
      :variants="variants.group"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.path
        d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
    </motion.g>
  </motion.svg>
</template>
