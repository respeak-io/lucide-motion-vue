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

const SPRING_TRANSITION: Transition  = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

const animations = {
  default: {
    lid: {
  initial: { y: 0 },
  animate: { y: -1.1 },
},
    path: {
              initial: { d: "M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8" },
              animate: { d: "M19 9v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V9" },
            },
    path2: {
              initial: { y1: 11, y2: 17 },
              animate: { y1: 11.5, y2: 17.5 },
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <Delete :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <motion.g
            :animate="current"
      @animationComplete="notifyComplete"
            :transition="SPRING_TRANSITION"
            :variants="variants.lid"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </motion.g>
          <motion.path
            :animate="current"
            d="M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8"
            :transition="SPRING_TRANSITION"
            :variants="variants.path"
          />
          <motion.line
            :animate="current"
            :transition="SPRING_TRANSITION"
            :variants="variants.path2"
            x1="10"
            x2="10"
            y1="11"
            y2="17"
          />
          <motion.line
            :animate="current"
            :transition="SPRING_TRANSITION"
            :variants="variants.path2"
            x1="14"
            x2="14"
            y1="11"
            y2="17"
          />
        </motion.svg>
</template>
