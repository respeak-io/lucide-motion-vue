<script setup lang="ts">
// Hand-written semantic animation. SVG geometry from Lucide (ISC).
// Safe to hand-edit — upstream port scripts preserve hand-written icons.
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
    topHead: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 2, -0.4, 0],
        transition: {
          duration: 0.5,
          delay: 0.32,
          ease: 'easeOut',
        },
      },
    },
    topPath: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.62,
          delay: 0,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0,
          },
        },
      },
    },
    bottomHead: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, -2, 0.4, 0],
        transition: {
          duration: 0.56,
          delay: 0.64,
          ease: 'easeOut',
        },
      },
    },
    bottomPath: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.68,
          delay: 0.38,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0.38,
          },
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
    <Repeat :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    style="user-select: none; -webkit-user-select: none"
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
      d="m17 2 4 4-4 4"
      :variants="variants.topHead"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M3 11v-1a4 4 0 0 1 4-4h14"
      :variants="variants.topPath"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="m7 22-4-4 4-4"
      :variants="variants.bottomHead"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M21 13v1a4 4 0 0 1-4 4H3"
      :variants="variants.bottomPath"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
