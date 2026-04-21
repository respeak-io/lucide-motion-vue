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

const DURATION = 0.3;

const CALCULATE_DELAY = (i: number) => {
  if (i === 0) return 0.1;

  return i * DURATION + 0.1;
};

const animations = {
  default: {
    path: {
            initial: { pathLength: 1, opacity: 1, transition: { delay: 0 } },
            animate: {
              pathLength: [0, 1],
              opacity: [0, 1],
            },
          },
    path2: {
            initial: {
              pathLength: 1,
              pathOffset: 0,
              opacity: 1,
              transition: { delay: 0 },
            },
            animate: {
              pathLength: [0, 1],
              opacity: [0, 1],
              pathOffset: [1, 0],
            },
          },
    path3: {
            initial: { opacity: 1, transition: { delay: 0 } },
            animate: { opacity: [0, 1] },
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
    <GitPullRequestClosed :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <motion.circle
          :animate="current"
      @animationComplete="notifyComplete"
          cx="6"
          cy="6"
          r="3"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(0),
            opacity: { delay: CALCULATE_DELAY(0) },
          }"
          :variants="variants.path"
        />

        <motion.path
          :animate="current"
          d="M6 9v12"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(1),
            opacity: { delay: CALCULATE_DELAY(1) },
          }"
          :variants="variants.path2"
        />

        <motion.path
          :animate="current"
          d="m21 3-6 6"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(2),
            opacity: { delay: CALCULATE_DELAY(2) },
          }"
          :variants="variants.path3"
        />

        <motion.path
          :animate="current"
          d="m21 9-6-6"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(2),
            opacity: { delay: CALCULATE_DELAY(2) },
          }"
          :variants="variants.path3"
        />

        <motion.path
          :animate="current"
          d="M18 11.5V15"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(3),
            opacity: { delay: CALCULATE_DELAY(3) },
          }"
          :variants="variants.path2"
        />

        <motion.circle
          :animate="current"
          cx="18"
          cy="18"
          r="3"
          :transition="{
            duration: DURATION,
            delay: CALCULATE_DELAY(4),
            opacity: { delay: CALCULATE_DELAY(4) },
          }"
          :variants="variants.path"
        />
      </motion.svg>
</template>
