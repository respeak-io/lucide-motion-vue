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
    path1: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: -1.5,
        y: 1.5,
        pathLength: 0.85,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: 1.5,
        y: -1.5,
        pathLength: 0.85,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: [0, -1.5, 0],
        y: [0, 1.5, 0],
        pathLength: [1, 0.85, 1],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
        },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: [0, 1.5, 0],
        y: [0, -1.5, 0],
        pathLength: [1, 0.85, 1],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
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
    <Link :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
