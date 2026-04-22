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
    variants: {
  initial: {
    rotate: 0,
    originX: "4px",
    originY: "20px",
  },
  animate: {
    rotate: [-10, -10, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.5, 1],
      ease: "easeInOut",
    },
  },
},
    clap: {
  initial: {
    rotate: 0,
    originX: "3px",
    originY: "11px",
  },
  animate: {
    rotate: [0, -10, 16, 0],
    transition: {
      duration: 0.4,
      times: [0, 0.3, 0.6, 1],
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <Clap :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <motion.g :animate="current"
      @animationComplete="notifyComplete" :variants="variants.variants">
            <motion.g :animate="current" :variants="variants.clap">
              <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
              <path d="m6.2 5.3 3.1 3.9" />
              <path d="m12.4 3.4 3.1 4" />
            </motion.g>
            <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          </motion.g>
        </motion.svg>
</template>
