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
          x: 0,
          y: 0,
        },
        animate: {
          x: [0, -1, 1, 0],
          y: [0, -1, 1, 0],
          transition: {
            duration: 1.4,
            ease: 'easeInOut',
          },
        },
      },
      path2: {},
    };

    for (let i = 1; i <= 4; i++) {
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
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <CloudSun :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M13,22h-6c-2.8,0-5-2.2-5-5,0-2.8,2.2-5,5-5,2.4,0,4.4,1.7,4.9,4h1.1c1.7,0,3,1.3,3,3s-1.3,3-3,3Z"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M15.9,12.6c.4-2.2-1.1-4.2-3.3-4.6-.9-.1-1.8,0-2.6.5"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="6.3"
        y1="6.3"
        x2="4.9"
        y2="4.9"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="12"
        y1="4"
        x2="12"
        y2="2"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="17.7"
        y1="6.3"
        x2="19.1"
        y2="4.9"
        :variants="variants.line3"
        initial="initial"
        :animate="current"
      />
      <motion.line
        x1="20"
        y1="12"
        x2="22"
        y2="12"
        :variants="variants.line4"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
