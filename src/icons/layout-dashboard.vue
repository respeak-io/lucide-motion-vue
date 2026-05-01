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
    rect1: {
      initial: {
        height: 9,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        height: 5,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    rect2: {
      initial: {
        height: 5,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        height: 9,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    rect3: {
      initial: {
        height: 9,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        height: 5,
        y: 4,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    rect4: {
      initial: {
        height: 5,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        height: 9,
        y: -4,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    rect1: {
      initial: {
        height: 9,
      },
      animate: {
        height: [9, 5, 9],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    rect2: {
      initial: {
        height: 5,
      },
      animate: {
        height: [5, 9, 5],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    rect3: {
      initial: {
        height: 9,
        y: 0,
      },
      animate: {
        height: [9, 5, 9],
        y: [0, 4, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    rect4: {
      initial: {
        height: 5,
        y: 0,
      },
      animate: {
        height: [5, 9, 5],
        y: [0, -4, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
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
    <LayoutDashboard :size="props.size" :strokeWidth="props.strokeWidth" />
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
        :width="7"
        :height="9"
        :x="3"
        :y="3"
        :rx="1"
        :ry="1"
        :variants="variants.rect1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.rect
        :width="7"
        :height="5"
        :x="14"
        :y="3"
        :rx="1"
        :ry="1"
        :variants="variants.rect2"
        initial="initial"
        :animate="current"
      />
      <motion.rect
        :width="7"
        :height="9"
        :x="14"
        :y="12"
        :rx="1"
        :ry="1"
        :variants="variants.rect3"
        initial="initial"
        :animate="current"
      />
      <motion.rect
        :width="7"
        :height="5"
        :x="3"
        :y="16"
        :rx="1"
        :ry="1"
        :variants="variants.rect4"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
