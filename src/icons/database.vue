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
    top: {
      initial: {
        y: 0,
        scaleX: 1,
      },
      animate: {
        y: [0, -2, 0],
        scaleX: [1, 0.9, 1],
        transformOrigin: '12px 5px',
        transition: {
          duration: 0.62,
          ease: 'easeOut',
        },
      },
    },
    body: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.9,
          delay: 0.08,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0.08,
          },
        },
      },
    },
    layer: {
      initial: {
        y: 0,
        opacity: 1,
        pathLength: 1,
      },
      animate: {
        y: [2, -0.5, 0],
        opacity: [0, 1, 1],
        pathLength: [0, 1],
        transition: {
          duration: 0.58,
          delay: 0.36,
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
    <Database :size="props.size" :strokeWidth="props.strokeWidth" />
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
    <motion.ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.top"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M3 5V19A9 3 0 0 0 21 19V5"
      :variants="variants.body"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M3 12A9 3 0 0 0 21 12"
      :variants="variants.layer"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
