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

const animations = {
  default: {
    wind: {
  initial: (custom: number) => ({
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      delay: custom,
    },
  }),
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      delay: custom,
    },
  }),
},
    arrow: {
  initial: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    y: [-10, 0],
    opacity: [0, 1],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      delay: 0.35,
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
  >
    <WindArrowDown :size="props.size" :strokeWidth="props.strokeWidth" />
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
          :custom="0.2"
          d="M12.8 21.6A2 2 0 1 0 14 18H2"
          initial="initial"
          :variants="variants.wind"
        />
        <motion.path
          :animate="current"
          :custom="0.4"
          d="M17.5 10a2.5 2.5 0 1 1 2 4H2"
          initial="initial"
          :variants="variants.wind"
        />
        <motion.path
          :animate="current"
          d="M10 2v8"
          initial="initial"
          :variants="variants.arrow"
        />
        <motion.path
          :animate="current"
          d="m6 6 4 4 4-4"
          initial="initial"
          :variants="variants.arrow"
        />
      </motion.svg>
</template>
