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
    path1: {},
    path2: {},
    path3: {},
    path4: {},
    path5: {},
    path6: {},
    path7: {},
    path8: {},
    path9: {},
    path10: {},
    path11: {},
    path12: {},
    line1: {
      initial: {
        y2: 16,
      },
      animate: {
        y2: [16, 11, 14, 16],
        transition: { duration: 0.6, ease: 'linear' },
      },
    },
    line2: {
      initial: {
        y2: 11,
      },
      animate: {
        y2: [11, 14, 16, 11],
        transition: { duration: 0.6, ease: 'linear' },
      },
    },
    line3: {
      initial: {
        y2: 14,
      },
      animate: {
        y2: [14, 16, 11, 14],
        transition: { duration: 0.6, ease: 'linear' },
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
  >
    <SquareDashedKanban :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M5 3a2 2 0 0 0-2 2"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M9 3h1"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M14 3h1"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M19 3a2 2 0 0 1 2 2"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M21 9v1"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M21 14v1"
        :variants="variants.path6"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M21 19a2 2 0 0 1-2 2"
        :variants="variants.path7"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M14 21h1"
        :variants="variants.path8"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M9 21h1"
        :variants="variants.path9"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M5 21a2 2 0 0 1-2-2"
        :variants="variants.path10"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 14v1"
        :variants="variants.path11"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 9v1"
        :variants="variants.path12"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="16"
        :y1="7"
        :x2="16"
        :y2="16"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="12"
        :y1="7"
        :x2="12"
        :y2="11"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="8"
        :y1="7"
        :x2="8"
        :y2="14"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
