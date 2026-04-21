<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: `normal` → `initial`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
import { computed } from 'vue'
import { motion, type Transition, type Variants } from 'motion-v'
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

const TRANSITION: Transition  = {
  duration: 0.5,
  ease: "easeInOut",
  repeat: 1,
};

const animations = {
  default: {
    y: {
  initial: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleY: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
  },
},
    x: {
  initial: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleX: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
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
    <Cpu :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
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
          <rect height="16" rx="2" width="16" x="4" y="4" />
          <rect height="6" rx="1" width="6" x="9" y="9" />
          <motion.path
            :animate="current"
      @animationComplete="notifyComplete"
            d="M15 2v2"
            :transition="TRANSITION"
            :variants="variants.y"
          />
          <motion.path
            :animate="current"
            d="M15 20v2"
            :transition="TRANSITION"
            :variants="variants.y"
          />
          <motion.path
            :animate="current"
            d="M2 15h2"
            :transition="TRANSITION"
            :variants="variants.x"
          />
          <motion.path
            :animate="current"
            d="M2 9h2"
            :transition="TRANSITION"
            :variants="variants.x"
          />
          <motion.path
            :animate="current"
            d="M20 15h2"
            :transition="TRANSITION"
            :variants="variants.x"
          />
          <motion.path
            :animate="current"
            d="M20 9h2"
            :transition="TRANSITION"
            :variants="variants.x"
          />
          <motion.path
            :animate="current"
            d="M9 2v2"
            :transition="TRANSITION"
            :variants="variants.y"
          />
          <motion.path
            :animate="current"
            d="M9 20v2"
            :transition="TRANSITION"
            :variants="variants.y"
          />
        </motion.svg>
</template>
