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
    svg: {
  initial: { rotate: 0, translateX: 0, translateY: 0 },
  animate: {
    rotate: [0, 0, 8, -3, 8, 0],
    translateY: [0, 2, 0, -1, 0],
  },
},
    path: {
  initial: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 0, 1],
    opacity: [0, 1],
    pathOffset: [0, 1, 0],
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <PenTool :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
          :animate="current"
      @animationComplete="notifyComplete"
          fill="none"
          :height="props.size"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="props.strokeWidth"
          :transition="{
            duration: 1,
          }"
          :variants="variants.svg"
          viewBox="0 0 24 24"
          :width="props.size"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" />
          <path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" />
          <motion.path
            :animate="current"
            d="m2.3 2.3 7.286 7.286"
            :transition="{
              duration: 0.8,
            }"
            :variants="variants.path"
          />
          <circle cx="11" cy="11" r="2" />
        </motion.svg>
</template>
