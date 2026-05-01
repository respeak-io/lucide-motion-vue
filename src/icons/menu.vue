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
    line1: {
      initial: {
        rotate: 0,
        x: 0,
        y: 0,
      },
      animate: {
        rotate: -45,
        x: -2.35,
        y: 0.35,
        transformOrigin: 'top right',
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 20,
        },
      },
    },
    line2: {
      initial: {
        opacity: 1,
      },
      animate: {
        opacity: 0,
        transition: {
          ease: 'easeInOut',
          duration: 0.2,
        },
      },
    },
    line3: {
      initial: {
        rotate: 0,
        x: 0,
        y: 0,
      },
      animate: {
        rotate: 45,
        x: -2.35,
        y: -0.35,
        transformOrigin: 'bottom right',
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 20,
        },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    line1: {
  initial: {
    rotate: 0,
    y: 0,
    opacity: 1,
  },
  animate: ((custom: number) => ({
    rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
    y: custom === 1 ? 6 : custom === 3 ? -6 : 0,
    opacity: custom === 2 ? 0 : 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  }))(1),
    },
    line2: {
  initial: {
    rotate: 0,
    y: 0,
    opacity: 1,
  },
  animate: ((custom: number) => ({
    rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
    y: custom === 1 ? 6 : custom === 3 ? -6 : 0,
    opacity: custom === 2 ? 0 : 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  }))(2),
    },
    line3: {
  initial: {
    rotate: 0,
    y: 0,
    opacity: 1,
  },
  animate: ((custom: number) => ({
    rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
    y: custom === 1 ? 6 : custom === 3 ? -6 : 0,
    opacity: custom === 2 ? 0 : 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  }))(3),
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
    <Menu :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.line
        :x1="4"
        :y1="6"
        :x2="20"
        :y2="6"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.line
        :x1="4"
        :y1="12"
        :x2="20"
        :y2="12"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="4"
        :y1="18"
        :x2="20"
        :y2="18"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
