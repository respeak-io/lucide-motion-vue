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
    line1: {},
    line2: {},
    line3: {
      initial: {
        pathLength: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          opacity: { duration: 0.1 },
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    line1: {},
    line2: {},
    line3: {
      initial: {
        pathLength: 1,
      },
      animate: {
        pathLength: [1, 0, 1],
        transition: { duration: 1.2, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'to-not': {
    line1: {},
    line2: {},
    line3: {
      initial: {
        pathLength: 0,
        opacity: 0,
      },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          opacity: { duration: 0.1 },
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <EqualNot :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
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
        x1="5"
        x2="19"
        y1="9"
        y2="9"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.line
        x1="5"
        x2="19"
        y1="15"
        y2="15"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="19"
        x2="5"
        y1="5"
        y2="19"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
