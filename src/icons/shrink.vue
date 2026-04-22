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
    path1: {
      initial: {
        y: 0,
        x: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        y: -1,
        x: -1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path2: {
      initial: {
        y: 0,
        x: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        y: 1,
        x: -1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path3: {
      initial: {
        y: 0,
        x: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        y: -1,
        x: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path4: {
      initial: {
        y: 0,
        x: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        y: 1,
        x: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: {
        y: 0,
        x: 0,
      },
      animate: {
        y: [0, -1, 0],
        x: [0, -1, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path2: {
      initial: {
        y: 0,
        x: 0,
      },
      animate: {
        y: [0, 1, 0],
        x: [0, -1, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path3: {
      initial: {
        y: 0,
        x: 0,
      },
      animate: {
        y: [0, -1, 0],
        x: [0, 1, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path4: {
      initial: {
        y: 0,
        x: 0,
      },
      animate: {
        y: [0, 1, 0],
        x: [0, 1, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    path1: {
              initial: { translateX: "0%", translateY: "0%" },
              animate: { translateX: "1px", translateY: "1px" },
    },
    path3: {
              initial: { translateX: "0%", translateY: "0%" },
              animate: { translateX: "-1px", translateY: "1px" },
    },
    path2: {
              initial: { translateX: "0%", translateY: "0%" },
              animate: { translateX: "1px", translateY: "-1px" },
    },
    path4: {
              initial: { translateX: "0%", translateY: "0%" },
              animate: { translateX: "-1px", translateY: "-1px" },
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
    <Shrink :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M9 19.8V15m0 0H4.2M9 15l-6 6"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M15 4.2V9m0 0h4.8M15 9l6-6"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M9 4.2V9m0 0H4.2M9 9 3 3"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
