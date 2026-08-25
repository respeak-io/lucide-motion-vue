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
    handle: {
      initial: {
        y: 0,
        pathLength: 1,
      },
      animate: {
        y: [0, -2.2, -1.4, 0],
        pathLength: [0.35, 1],
        transition: {
          duration: 0.72,
          ease: 'easeOut',
        },
      },
    },
    case: {
      initial: {
        scaleY: 1,
      },
      animate: {
        scaleY: [1, 0.92, 1.04, 1],
        transformOrigin: '12px 20px',
        transition: {
          duration: 0.84,
          delay: 0.08,
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
    <Briefcase :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
      :variants="variants.handle"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.rect
      width="20"
      height="14"
      x="2"
      y="6"
      rx="2"
      :style="{ transformBox: 'view-box' }"
      :variants="variants.case"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
