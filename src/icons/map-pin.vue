<script setup lang="ts">
// Auto-generated from animate-ui upstream by scripts/port-icons.mjs.
// Variants and SVG geometry adapted from animate-ui (MIT + Commons Clause).
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
    group: {
      initial: {
        scale: 1,
        rotate: 0,
        x: 0,
        y: 0,
        transformOrigin: 'bottom center',
      },
      animate: {
        scale: [1, 0.75, 1, 1],
        rotate: [0, 30, -15, 0],
        x: [0, 0, 0, 0],
        y: [0, -6, 0, 0],
        transformOrigin: 'bottom center',
        transition: { ease: 'easeInOut', duration: 1 },
      },
    },
    circle: {},
    path: {},
  } satisfies Record<string, Variants>,
  wiggle: {
    group: {
      initial: {
        rotate: 0,
        transformOrigin: 'bottom center',
      },
      animate: {
        rotate: [0, 12, -10, 0],
        transformOrigin: 'bottom center',
        transition: { ease: 'easeInOut', duration: 1 },
      },
    },
    circle: {},
    path: {},
  } satisfies Record<string, Variants>,
  rotate: {
    group: {
      initial: {
        transform: 'rotate3d(0, 1, 0, 0deg)',
        perspective: 600,
      },
      animate: {
        transform: 'rotate3d(0, 1, 0, 360deg)',
        perspective: 600,
        transition: { ease: 'easeInOut', duration: 0.7 },
      },
    },
    circle: {},
    path: {},
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    group: {
  initial: {
    y: 0,
  },
  animate: {
    y: [0, -5, -3],
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
    },
  },
    },
    circle: {
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [0.5, 0],
    transition: {
      delay: 0.3,
      duration: 0.5,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
    },
    path: {},
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
    <MapPin :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.g :variants="variants.group" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.circle
          :cx="12"
          :cy="10"
          :r="3"
          :variants="variants.circle"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          :variants="variants.path"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
