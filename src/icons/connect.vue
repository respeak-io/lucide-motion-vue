<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: `normal` → `initial`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
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

const PATH_VARIANTS = {
  normal: (custom: { x: number; y: number }) => ({
    d: `M${custom.x} ${custom.y} l2.5 -2.5`,
  }),
  animate: (custom: { x: number; y: number }) => ({
    d: `M${custom.x + 2.93} ${custom.y - 2.93} l0.10 -0.10`,
  }),
};

const animations = {
  default: {
    plug: {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: -3,
    y: 3,
  },
},
    socket: {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 3,
    y: -3,
  },
},
    path: {
              initial: {
                d: "M19 5l3 -3",
              },
              animate: {
                d: "M17 7l5 -5",
              },
            },
    path2: {
              initial: {
                d: "m2 22 3-3",
              },
              animate: {
                d: "m2 22 6-6",
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
  >
    <Connect :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
          fill="none"
          :height="props.size"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="props.strokeWidth"
          viewBox="0 0 24 24"
          :width="props.size"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            :animate="current"
      @animationComplete="notifyComplete"
            d="M19 5l3 -3"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            d="m2 22 3-3"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.path2"
          />
          <motion.path
            :animate="current"
            d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.socket"
          />
          <motion.path
            :animate="current"
            :custom="{ x: 7.5, y: 13.5 }"
            initial="initial"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            :custom="{ x: 10.5, y: 16.5 }"
            initial="initial"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"
            :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
            :variants="variants.plug"
          />
        </motion.svg>
</template>
