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
    book: {
      initial: {
        y: 0,
        scaleY: 1,
      },
      animate: {
        y: [0, -2, 0],
        scaleY: [1, 1.08, 1],
        transformOrigin: '7px 21px',
        transition: {
          duration: 0.68,
          ease: 'easeOut',
        },
      },
    },
    spine: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.48,
          delay: 0.24,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0.24,
          },
        },
      },
    },
    leaning: {
      initial: {
        rotate: 0,
        y: 0,
      },
      animate: {
        rotate: [0, -7, 2, 0],
        y: [0, -1.5, 0],
        transformOrigin: '15.5px 21px',
        transition: {
          duration: 0.88,
          delay: 0.12,
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
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <LibraryBig :size="props.size" :strokeWidth="props.strokeWidth" />
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
      width="8"
      height="18"
      x="3"
      y="3"
      rx="1"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.book"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M7 3v18"
      :variants="variants.spine"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.leaning"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
