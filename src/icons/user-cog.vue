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
    shoulders: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.62,
          delay: 0.18,
          ease: 'easeInOut',
          opacity: {
            duration: 0.08,
            delay: 0.18,
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
        scale: [0.72, 1.14, 1],
        opacity: [0.5, 1, 1],
        transformOrigin: '9px 7px',
        transition: {
          duration: 0.55,
          ease: 'easeOut',
        },
      },
    },
    gear: {
      initial: {
        rotate: 0,
        scale: 1,
        opacity: 1,
      },
      animate: {
        rotate: [0, 100, 180],
        scale: [0.86, 1.08, 1],
        opacity: [0.65, 1, 1],
        transformOrigin: '18px 15px',
        transition: {
          duration: 0.92,
          delay: 0.2,
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
    <UserCog :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M10 15H6a4 4 0 0 0-4 4v2"
      :variants="variants.shoulders"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.circle
      cx="9"
      cy="7"
      r="4"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.head"
      initial="initial"
      :animate="current"
    />
    <motion.g
      :style="{ transformBox: 'view-box' }"
      :variants="variants.gear"
      initial="initial"
      :animate="current">
      <path
        d="m14.305 16.53.923-.382"
      />
      <path
        d="m15.228 13.852-.923-.383"
      />
      <path
        d="m16.852 12.228-.383-.923"
      />
      <path
        d="m16.852 17.772-.383.924"
      />
      <path
        d="m19.148 12.228.383-.923"
      />
      <path
        d="m19.53 18.696-.382-.924"
      />
      <path
        d="m20.772 13.852.924-.383"
      />
      <path
        d="m20.772 16.148.924.383"
      />
      <circle
        cx="18"
      cy="15"
      r="3"
      />
    </motion.g>
  </motion.svg>
</template>
