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
    stem: {
  initial: { y: 0 },
  animate: {
    y: 2,
    transition: { duration: 0.1 },
  },
},
    bell: {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -2, 2, -2, 2, -1, 1, 0],
    transition: {
      delay: 0.1,
      duration: 0.28,
      ease: "easeInOut",
    },
  },
},
    soundWaves: {
  initial: { opacity: 0, scale: 1 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0.8, 1, 1.3],
    transition: {
      delay: 0.13,
      duration: 0.7,
      ease: "easeOut",
      times: [0, 0.2, 1],
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
    <ConciergeBell :size="props.size" :strokeWidth="props.strokeWidth" />
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
          :style="{ overflow: 'visible' }"
          viewBox="0 0 24 24"
          :width="props.size"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" />

          <motion.g
            :animate="current"
      @animationComplete="notifyComplete"
            initial="initial"
            :style="{ originX: '50%', originY: '100%' }"
            :variants="variants.bell"
          >
            <path d="M20 16a8 8 0 1 0-16 0" />

            <motion.g :variants="variants.stem">
              <path d="M10 4h4" />
              <path d="M12 4v4" />
            </motion.g>
          </motion.g>

          <motion.g
            :animate="current"
            initial="initial"
            :style="{ originX: '14px', originY: '18px' }"
            :variants="variants.soundWaves"
          >
            <path d="M2 13a7 7 0 0 1 1-3.5" opacity="0.7" :stroke-width="props.strokeWidth" />
            <path d="M21 13a7 7 0 0 0-1-3.5" opacity="0.7" :stroke-width="props.strokeWidth" />
          </motion.g>
        </motion.svg>
</template>
