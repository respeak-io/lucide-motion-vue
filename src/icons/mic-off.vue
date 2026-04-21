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
    line: {
  initial: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.4,
      delay: 0.15,
      opacity: { duration: 0.1 },
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
    <MicOff :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <path d="M12 19v3" />
          <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
          <path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />
          <path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
          <motion.path
            :animate="current"
      @animationComplete="notifyComplete"
            d="m2 2 20 20"
            initial="initial"
            :variants="variants.line"
          />
        </motion.svg>
</template>
