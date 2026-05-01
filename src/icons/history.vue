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

const ARROW_TRANSITION: Transition  = {
  type: "spring",
  stiffness: 250,
  damping: 25,
};

const HAND_TRANSITION: Transition  = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
};

const MINUTE_HAND_TRANSITION: Transition  = {
  duration: 0.5,
  ease: "easeInOut",
};

const animations = {
  default: {
    arrow: {
  initial: {
    rotate: "0deg",
  },
  animate: {
    rotate: "-50deg",
  },
},
    hand: {
  initial: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: -360,
    originX: "0%",
    originY: "100%",
  },
},
    minuteHand: {
  initial: {
    rotate: 0,
    originX: "0%",
    originY: "0%",
  },
  animate: {
    rotate: -45,
    originX: "0%",
    originY: "0%",
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
    <History :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    style="user-select: none; -webkit-user-select: none"
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
            :transition="ARROW_TRANSITION"
            :variants="variants.arrow"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </motion.g>
          <motion.line
            :animate="current"
            initial="initial"
            :transition="HAND_TRANSITION"
            :variants="variants.hand"
            x1="12"
            x2="12"
            y1="12"
            y2="7"
          />
          <motion.line
            :animate="current"
            initial="initial"
            :transition="MINUTE_HAND_TRANSITION"
            :variants="variants.minuteHand"
            x1="12"
            x2="16"
            y1="12"
            y2="14"
          />
        </motion.svg>
</template>
