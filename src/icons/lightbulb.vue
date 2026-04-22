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
        rotate: 0,
        fill: 'transparent',
      },
      animate: {
        transformOrigin: 'bottom center',
        fill: 'currentColor',
        rotate: [0, -20, 15, -7, 0],
        fillOpacity: [0, 1, 0, 1, 0],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
          rotate: {
            duration: 0.8,
            ease: 'easeInOut',
            times: [0, 0.4, 0.6, 0.8, 1],
          },
          fillOpacity: {
            duration: 0.3,
            ease: 'easeInOut',
            times: [0, 0.4, 0.6, 0.8, 1],
            delay: 0.4,
          },
        },
      },
    },
    path2: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'bottom center',
        rotate: [0, 0, 10, -5, 0],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
          times: [0, 0.4, 0.6, 0.8, 1],
        },
      },
    },
    path3: {},
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
    <Lightbulb :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M9 18h6"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M10 22h4"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
