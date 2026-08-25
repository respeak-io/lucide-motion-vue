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
    frame: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.86,
          delay: 0,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0,
          },
        },
      },
    },
    head: {
      initial: {
        scale: 1,
        opacity: 1,
      },
      animate: {
        scale: [0.65, 1.16, 1],
        opacity: [0, 1, 1],
        transformOrigin: '12px 10px',
        transition: {
          duration: 0.52,
          delay: 0.2,
          ease: 'easeOut',
        },
      },
    },
    shoulders: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.55,
          delay: 0.4,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0.4,
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
    <SquareUser :size="props.size" :strokeWidth="props.strokeWidth" />
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
    <motion.rect
      width="18"
      height="18"
      x="3"
      y="3"
      rx="2"
      :variants="variants.frame"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.circle
      cx="12"
      cy="10"
      r="3"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.head"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"
      :variants="variants.shoulders"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
