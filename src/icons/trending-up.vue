<script setup lang="ts">
// Hand-ported from pqoqubbw/icons (MIT). Variants and SVG geometry adapted
// from https://github.com/pqoqubbw/icons/blob/main/icons/trending-up.tsx.
// Adapted to our AnimateIcon context: `normal` → `initial`. The SVG-level
// wiggle only defines `animate` upstream; we add an explicit `initial` so
// the variants object is well-formed for our single-`current` state model.
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

const animations = {
  default: {
    svg: {
      initial: { translateX: 0, translateY: 0 },
      animate: {
        translateX: [0, 2, 0],
        translateY: [0, -2, 0],
        transition: { duration: 0.5 },
      },
    },
    line: {
      initial: {
        opacity: 1,
        pathLength: 1,
        transition: { duration: 0.4, opacity: { duration: 0.1 } },
      },
      animate: {
        opacity: [0, 1],
        pathLength: [0, 1],
        pathOffset: [1, 0],
        transition: { duration: 0.4, opacity: { duration: 0.1 } },
      },
    },
    arrow: {
      initial: {
        opacity: 1,
        pathLength: 1,
        transition: {
          delay: 0.3,
          duration: 0.3,
          opacity: { duration: 0.1, delay: 0.3 },
        },
      },
      animate: {
        opacity: [0, 1],
        pathLength: [0, 1],
        pathOffset: [0.5, 0],
        transition: {
          delay: 0.3,
          duration: 0.3,
          opacity: { duration: 0.1, delay: 0.3 },
        },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    svg: {
  animate: {
    x: 0,
    y: 0,
    translateX: [0, 2, 0],
    translateY: [0, -2, 0],
    transition: {
      duration: 0.5,
    },
  },
    },
    line: {
  initial: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
    },
    arrow: {
  initial: {
    opacity: 1,
    pathLength: 1,
    transition: {
      delay: 0.3,
      duration: 0.3,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [0.5, 0],
    transition: {
      delay: 0.3,
      duration: 0.3,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
    },
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
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <TrendingUp :size="props.size" :strokeWidth="props.strokeWidth" />
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
    :variants="variants.svg"
    initial="initial"
    :animate="current"
    @animationComplete="notifyComplete"
  >
    <motion.polyline
      points="22 7 13.5 15.5 8.5 10.5 2 17"
      :variants="variants.line"
      initial="initial"
      :animate="current"
    />
    <motion.polyline
      points="16 7 22 7 22 13"
      :variants="variants.arrow"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
