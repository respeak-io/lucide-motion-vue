<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Upstream source: clock
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
    hand: {
  initial: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 360,
    originX: "0%",
    originY: "100%",
  },
},
    minuteHand: {
  initial: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 45,
    originX: "0%",
    originY: "100%",
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
    <Clock13 :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <circle cx="12" cy="12" r="10" />
          <motion.line
            :animate="current"
      @animationComplete="notifyComplete"
            initial="initial"
            :transition="HAND_TRANSITION"
            :variants="variants.hand"
            x1="12"
            x2="12"
            y1="12"
            y2="6"
          />
          <motion.line
            :animate="current"
            initial="initial"
            :transition="MINUTE_HAND_TRANSITION"
            :variants="variants.minuteHand"
            x1="12"
            x2="16"
            y1="12"
            y2="12"
          />
        </motion.svg>
</template>
