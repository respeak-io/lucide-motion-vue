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

const DURATION = 0.25;

const CALCULATE_DELAY = (i: number) => {
  return i === 0 ? 0.1 : i * DURATION + 0.1;
};

const animations = {
  default: {
    path: {
              initial: {
                pathLength: 1,
                pathOffset: 0,
                opacity: 1,
                transition: { delay: 0 },
              },
              animate: {
                pathOffset: [1, 0],
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
                pathOffset: [1, 0],
                opacity: [0, 1],
              },
            },
    path3: {
              initial: { pathLength: 1, opacity: 1, transition: { delay: 0 } },
              animate: {
                pathLength: [0, 1],
                opacity: [0, 1],
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
    <Stethoscope :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <motion.path
            :animate="current"
      @animationComplete="notifyComplete"
            d="M11 2v2"
            :transition="{
              duration: DURATION,
              delay: CALCULATE_DELAY(2),
              opacity: { delay: CALCULATE_DELAY(2) },
            }"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            d="M5 2v2"
            :transition="{
              duration: DURATION,
              delay: CALCULATE_DELAY(2),
              opacity: { delay: CALCULATE_DELAY(2) },
            }"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"
            :transition="{
              duration: DURATION,
              delay: CALCULATE_DELAY(2),
              opacity: { delay: CALCULATE_DELAY(2) },
            }"
            :variants="variants.path2"
          />
          <motion.path
            :animate="current"
            d="M8 15a6 6 0 0 0 12 0v-3"
            :transition="{
              duration: DURATION,
              delay: CALCULATE_DELAY(1),
              opacity: { delay: CALCULATE_DELAY(1) },
            }"
            :variants="variants.path"
          />
          <motion.circle
            :animate="current"
            cx="20"
            cy="10"
            r="2"
            :transition="{
              duration: DURATION,
              delay: CALCULATE_DELAY(0),
              opacity: { delay: CALCULATE_DELAY(0) },
            }"
            :variants="variants.path3"
          />
        </motion.svg>
</template>
