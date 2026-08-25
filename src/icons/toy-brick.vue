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
    body: {
      initial: {
        scaleY: 1,
      },
      animate: {
        scaleY: [1, 0.88, 1.07, 1],
        transformOrigin: '12px 20px',
        transition: {
          duration: 0.74,
          ease: 'easeOut',
        },
      },
    },
    leftStud: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -3, 0.7, 0],
        transition: {
          duration: 0.62,
          delay: 0.1,
          ease: 'easeOut',
        },
      },
    },
    rightStud: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -3, 0.7, 0],
        transition: {
          duration: 0.72,
          delay: 0.24,
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
    <ToyBrick :size="props.size" :strokeWidth="props.strokeWidth" />
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
      height="12"
      x="3"
      y="8"
      rx="1"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.body"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3"
      :variants="variants.leftStud"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3"
      :variants="variants.rightStud"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
