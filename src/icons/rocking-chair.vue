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

const DEFAULT_TRANSITION: Transition  = {
  type: "spring",
  stiffness: 100,
  damping: 12,
  mass: 0.4,
};

const animations = {
  default: {
    rocking: {
  initial: { rotate: 0 },
  animate: {
    rotate: [-5, 5, -5],
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "mirror" as const,
      duration: 1.2,
      ease: "easeInOut",
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
    <RockingChair :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
        :animate="current"
      @animationComplete="notifyComplete"
        fill="none"
        :height="props.size"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="props.strokeWidth"
        :style="{ originX: '10%', originY: '90%' }"
        :variants="variants.rocking"
        viewBox="0 0 24 24"
        :width="props.size"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.polyline
          :animate="current"
          points="3.5 2 6.5 12.5 18 12.5"
          :transition="DEFAULT_TRANSITION"
        />
        <motion.line
          :animate="current"
          :transition="DEFAULT_TRANSITION"
          x1="9.5"
          x2="5.5"
          y1="12.5"
          y2="20"
        />
        <motion.line
          :animate="current"
          :transition="DEFAULT_TRANSITION"
          x1="15"
          x2="18.5"
          y1="12.5"
          y2="20"
        />
        <motion.path
          :animate="current"
          d="M2.75 18a13 13 0 0 0 18.5 0"
          :transition="DEFAULT_TRANSITION"
        />
      </motion.svg>
</template>
