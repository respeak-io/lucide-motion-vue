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
    front: {
      initial: {
        x: 0,
        y: 0,
        rotate: 0,
      },
      animate: {
        x: [0, 1.5, 0],
        y: [0, -1.5, 0],
        rotate: [0, 4, 0],
        transformOrigin: '10.5px 6.5px',
        transition: {
          duration: 0.82,
          ease: 'easeInOut',
        },
      },
    },
    back: {
      initial: {
        x: 0,
        y: 0,
        opacity: 1,
      },
      animate: {
        x: [0, -2, 0],
        y: [0, 1.5, 0],
        opacity: [1, 0.65, 1],
        transition: {
          duration: 0.94,
          delay: 0.08,
          ease: 'easeInOut',
        },
      },
    },
    hole: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.8, 0.8, 1],
        transformOrigin: '10.5px 6.5px',
        transition: {
          duration: 0.54,
          delay: 0.22,
          ease: 'easeOut',
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
    <Tags :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.front"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"
      :variants="variants.back"
      initial="initial"
      :animate="current"
    />
    <motion.circle
      cx="10.5"
      cy="6.5"
      r="0.5"
      fill="currentColor"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.hole"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
