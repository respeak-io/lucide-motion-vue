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
      path1: {
        initial: {
          rotate: 0,
        },
        animate: {
          rotate: [0, -10, 10, 0],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
          },
        },
      },
      path2: {},
    };

    for (let i = 1; i <= 3; i++) {
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
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <SunMoon :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.path
        d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M16 12a4 4 0 0 0-4-4"
        :variants="variants.path2"
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
        x2="19"
        y2="5"
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
    </motion.svg>
</template>
