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
    path: {
          initial: { rotate: 0, translateX: 0, translateY: 0 },
          animate: {
            rotate: [0, -12, 12, -8, 8, 0],
            translateX: [0, -1.5, 1.5, -1, 1, 0],
            translateY: [0, -1, 1, -0.5, 0.5, 0],
          },
        },
    path2: {
            initial: { translateX: 0, translateY: 0, rotate: 0 },
            animate: {
              translateX: [0, -0.8, 0.8, -0.6, 0.6, 0],
              translateY: [0, -0.5, 0.5, -0.3, 0.3, 0],
              rotate: [0, -6, 6, -4, 4, 0],
            },
          },
    path3: {
            initial: { translateX: 0, translateY: 0, rotate: 0, scale: 1 },
            animate: {
              translateX: [0, -1.6, 1.6, -1.2, 1.2, 0],
              translateY: [0, -1.2, 1.2, -0.8, 0.8, 0],
              rotate: [0, -10, 10, -7, 7, 0],
              scale: [1, 1.08, 0.95, 1.06, 0.98, 1],
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
  >
    <BellElectric :size="props.size" :strokeWidth="props.strokeWidth" />
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
        :style="{ transformBox: 'fill-box', transformOrigin: '50% 50%' }"
        :transition="{ duration: 0.9 }"
        :variants="variants.path"
        viewBox="0 0 24 24"
        :width="props.size"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18.518 17.347A7 7 0 0 1 14 19" />
        <motion.path
          :animate="current"
          d="M18.8 4A11 11 0 0 1 20 9"
          :style="{ transformBox: 'fill-box', originX: '50%', originY: '50%' }"
          :transition="{ duration: 0.9 }"
          :variants="variants.path2"
        />
        <motion.path
          :animate="current"
          d="M9 9h.01"
          :style="{ transformBox: 'fill-box', originX: '50%', originY: '50%' }"
          :transition="{ duration: 0.75 }"
          :variants="variants.path3"
        />
        <circle cx="9" cy="9" r="7" />
        <rect height="6" rx="2" width="10" x="4" y="16" />
        <circle cx="20" cy="16" r="2" />
      </motion.svg>
</template>
