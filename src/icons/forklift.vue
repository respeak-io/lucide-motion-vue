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
    circle1: {},
    circle2: {},
    path1: {},
    path2: {},
    line: {
      initial: {
        y1: 19,
        y2: 19,
      },
      animate: {
        y1: [19, 5, 6],
        y2: [19, 5, 6],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    circle1: {},
    circle2: {},
    path1: {},
    path2: {},
    line: {
      initial: {
        y1: 19,
        y2: 19,
      },
      animate: {
        y1: [19, 5, 6, 19],
        y2: [19, 5, 6, 19],
        transition: {
          duration: 1.2,
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
    <Forklift :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.path
        d="M12,12h-7c-1.1,0-2,.9-2,2v5"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.circle
        :cx="13"
        :cy="19"
        :r="2"
        :variants="variants.circle1"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        :cx="5"
        :cy="19"
        :r="2"
        :variants="variants.circle2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M8,19h3M16,2v17M6,12v-5c0-1.1.9-2,2-2h3l5,5"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="22"
        :y1="19"
        :x2="16"
        :y2="19"
        :variants="variants.line"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
