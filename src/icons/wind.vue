<script setup lang="ts">
// Hand-ported from pqoqubbw/icons (MIT). Variants and SVG geometry adapted
// from https://github.com/pqoqubbw/icons/blob/main/icons/wind.tsx.
// Adapted to our AnimateIcon context: `normal` → `initial`. Uses motion-v
// dynamic variants via the `:custom` prop to stagger each gust's delay.
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
      initial: (custom: number) => ({
        pathLength: 1,
        opacity: 1,
        pathOffset: 0,
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
          delay: custom,
        },
      }),
      animate: (custom: number) => ({
        pathLength: [0, 1],
        opacity: [0, 1],
        pathOffset: [1, 0],
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
          delay: custom,
        },
      }),
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    path: {
  initial: (custom: number) => ({
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      delay: custom,
    },
  }),
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      delay: custom,
    },
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
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <Wind :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M17.5 8a2.5 2.5 0 1 1 2 4H2"
      :custom="0"
      :variants="variants.path"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M12.8 19.6A2 2 0 1 0 14 16H2"
      :custom="0.2"
      :variants="variants.path"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M9.8 4.4A2 2 0 1 1 11 8H2"
      :custom="0.4"
      :variants="variants.path"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
