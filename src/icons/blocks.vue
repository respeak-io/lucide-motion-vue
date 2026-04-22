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
        d: 'M10 22V7c0-.6-.4-1-1-1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5c0-.6-.4-1-1-1H2',
        strokeLinejoin: 'round',
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: 2,
        y: -2,
        d: 'M10 22V6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6H2',
        strokeLinejoin: 'miter',
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
          d: { duration: 0, delay: 0.3 },
          strokeLinejoin: { duration: 0, delay: 0.3 },
        },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        d: 'M15 2 H21 A1 1 0 0 1 22 3 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: -2,
        y: 2,
        d: 'M15 2 H20 A2 2 0 0 1 22 4 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
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
        d: 'M10 22V7c0-.6-.4-1-1-1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5c0-.6-.4-1-1-1H2',
        strokeLinejoin: 'round',
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: [0, 2, 0],
        y: [0, -2, 0],
        d: [
          'M10 22V7c0-.6-.4-1-1-1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5c0-.6-.4-1-1-1H2',
          'M10 22V6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6H2',
          'M10 22V7c0-.6-.4-1-1-1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5c0-.6-.4-1-1-1H2',
        ],
        strokeLinejoin: ['round', 'miter', 'round'],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
          d: { duration: 0, delay: 0.3 },
          strokeLinejoin: { duration: 0, delay: 0.3 },
        },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        d: 'M15 2 H21 A1 1 0 0 1 22 3 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
      animate: {
        x: [0, -2, 0],
        y: [0, 2, 0],
        d: [
          'M15 2 H21 A1 1 0 0 1 22 3 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
          'M15 2 H20 A2 2 0 0 1 22 4 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
          'M15 2 H21 A1 1 0 0 1 22 3 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z',
        ],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    path1: {
  initial: { translateX: 0, translateY: 0 },
  animate: { translateX: -4, translateY: 4 },
    },
    path2: {},
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
    <Blocks :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M10 22V7c0-.6-.4-1-1-1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5c0-.6-.4-1-1-1H2"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M15 2 H21 A1 1 0 0 1 22 3 V9 A1 1 0 0 1 21 10 H15 A1 1 0 0 1 14 9 V3 A1 1 0 0 1 15 2 Z"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
