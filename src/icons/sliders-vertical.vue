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
    line1: {
      initial: { y2: 10 },
      animate: { y2: 4, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
    line2: {
      initial: { y1: 14, y2: 14 },
      animate: {
        y1: 8,
        y2: 8,
        transition: { ease: 'easeInOut', duration: 0.4 },
      },
    },
    line3: {
      initial: { y1: 14 },
      animate: { y1: 8, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
    line4: {
      initial: { y2: 12 },
      animate: { y2: 20, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
    line5: {
      initial: { y1: 8, y2: 8 },
      animate: {
        y1: 16,
        y2: 16,
        transition: { ease: 'easeInOut', duration: 0.4 },
      },
    },
    line6: {
      initial: { y1: 8 },
      animate: { y1: 16, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
    line7: {
      initial: { y2: 16 },
      animate: { y2: 11, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
    line8: {
      initial: { y1: 16, y2: 16 },
      animate: {
        y1: 11,
        y2: 11,
        transition: { ease: 'easeInOut', duration: 0.4 },
      },
    },
    line9: {
      initial: { y1: 12 },
      animate: { y1: 7, transition: { ease: 'easeInOut', duration: 0.4 } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    line1: {
      initial: { y2: 10 },
      animate: {
        y2: [10, 4, 10],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line2: {
      initial: { y1: 14, y2: 14 },
      animate: {
        y1: [14, 8, 14],
        y2: [14, 8, 14],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line3: {
      initial: { y1: 14 },
      animate: {
        y1: [14, 8, 14],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line4: {
      initial: { y2: 12 },
      animate: {
        y2: [12, 20, 12],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line5: {
      initial: { y1: 8, y2: 8 },
      animate: {
        y1: [8, 16, 8],
        y2: [8, 16, 8],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line6: {
      initial: { y1: 8 },
      animate: {
        y1: [8, 16, 8],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line7: {
      initial: { y2: 16 },
      animate: {
        y2: [16, 11, 16],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line8: {
      initial: { y1: 16, y2: 16 },
      animate: {
        y1: [16, 11, 16],
        y2: [16, 11, 16],
        transition: { ease: 'easeInOut', duration: 0.8 },
      },
    },
    line9: {
      initial: { y1: 12 },
      animate: {
        y1: [12, 7, 12],
        transition: { ease: 'easeInOut', duration: 0.8 },
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
    <SlidersVertical :size="props.size" :strokeWidth="props.strokeWidth" />
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
        y1="3"
        x2="5"
        y2="10"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.line
        x1="3"
        y1="14"
        x2="7"
        y2="14"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="5"
        y1="14"
        x2="5"
        y2="21"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="12"
        y1="21"
        x2="12"
        y2="12"
        :variants="variants.line4"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="10"
        y1="8"
        x2="14"
        y2="8"
        :variants="variants.line5"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="12"
        y1="8"
        x2="12"
        y2="3"
        :variants="variants.line6"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="19"
        y1="21"
        x2="19"
        y2="16"
        :variants="variants.line7"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="17"
        y1="16"
        x2="21"
        y2="16"
        :variants="variants.line8"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="19"
        y1="12"
        x2="19"
        y2="3"
        :variants="variants.line9"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
