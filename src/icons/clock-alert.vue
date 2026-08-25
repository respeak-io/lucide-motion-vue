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
    hands: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 18, -4, 0],
        transformOrigin: '12px 12px',
        transition: {
          duration: 0.82,
          ease: 'easeInOut',
        },
      },
    },
    alert: {
      initial: {
        scaleY: 1,
        opacity: 1,
      },
      animate: {
        scaleY: [0.35, 1.18, 1],
        opacity: [0.4, 1, 1],
        transformOrigin: '20px 17px',
        transition: {
          duration: 0.5,
          delay: 0.32,
          ease: 'easeOut',
        },
      },
    },
    dot: {
      initial: {
        scale: 1,
        opacity: 1,
      },
      animate: {
        scale: [0, 1.45, 1],
        opacity: [0, 1, 1],
        transformOrigin: '20px 21px',
        transition: {
          duration: 0.38,
          delay: 0.58,
          ease: 'easeOut',
        },
      },
    },
    clock: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.88,
          delay: 0,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0,
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
    <ClockAlert :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M12 6v6l4 2"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.hands"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M20 12v5"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.alert"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M20 21h.01"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.dot"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M21.25 8.2A10 10 0 1 0 16 21.16"
      :variants="variants.clock"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
