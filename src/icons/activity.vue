<script setup lang="ts">
// Auto-generated from animate-ui upstream by scripts/port-icons.mjs.
// Variants and SVG geometry adapted from animate-ui (MIT + Commons Clause).
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
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [0, 1],
        pathLength: [0, 1],
        pathOffset: [1, 0],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-return': {
    path: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [0, 1, 1, 1],
        pathLength: [0, 1, 0, 1],
        pathOffset: [1, 0, 0.01, 0],
        transition: {
          duration: 2.5,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [0, 1, 1, 1, 1],
        pathLength: [0, 1, 0, 1, 0],
        pathOffset: [1, 0, 0.01, 0, 0.999],
        transition: {
          duration: 3,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
          opacity: { duration: 0.01 },
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
    <Activity :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      :width="props.size"
      :height="props.size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="props.strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <motion.path
        d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        :variants="variants.path"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
    </motion.svg>
</template>
