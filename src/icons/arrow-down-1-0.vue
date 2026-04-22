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

const SWAP_TRANSITION: Transition  = {
  type: "spring",
  stiffness: 240,
  damping: 24,
};

const animations = {
  default: {
    swap: {
  initial: {
    translateY: 0,
  },
  animate: (custom: number) => ({
    translateY: custom * 10,
  }),
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
    <ArrowDown10 :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <path d="m3 16 4 4 4-4" />
          <path d="M7 20V4" />
          <motion.g
            :animate="current"
      @animationComplete="notifyComplete"
            :custom="1"
            initial="initial"
            :transition="SWAP_TRANSITION"
            :variants="variants.swap"
          >
            <path d="M17 10V4h-2" />
            <path d="M15 10h4" />
          </motion.g>
          <motion.rect
            :animate="current"
            :custom="-1"
            height="6"
            initial="initial"
            ry="2"
            :transition="SWAP_TRANSITION"
            :variants="variants.swap"
            width="4"
            x="15"
            y="14"
          />
        </motion.svg>
</template>
