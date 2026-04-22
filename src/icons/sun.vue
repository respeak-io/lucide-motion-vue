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
  default: (() => {
    const animation: Record<string, Variants> = {
      circle: {},
    };

    for (let i = 1; i <= 8; i++) {
      animation[`line${i}`] = {
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: [0, 1],
          pathLength: [0, 1],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
            delay: (i - 1) * 0.15,
          },
        },
      };
    }

    return animation;
  })() satisfies Record<string, Variants>,
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
    <Sun :size="props.size" :strokeWidth="props.strokeWidth" />
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
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="4"
        :variants="variants.circle"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="12"
        y1="4"
        x2="12"
        y2="2"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="17.7"
        y1="6.3"
        x2="19.1"
        y2="4.9"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="20"
        y1="12"
        x2="22"
        y2="12"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="17.7"
        y1="17.7"
        x2="19.1"
        y2="19.1"
        :variants="variants.line4"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="12"
        y1="20"
        x2="12"
        y2="22"
        :variants="variants.line5"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="6.3"
        y1="17.7"
        x2="4.9"
        y2="19.1"
        :variants="variants.line6"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="4"
        y1="12"
        x2="2"
        y2="12"
        :variants="variants.line7"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="6.3"
        y1="6.3"
        x2="4.9"
        y2="4.9"
        :variants="variants.line8"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
