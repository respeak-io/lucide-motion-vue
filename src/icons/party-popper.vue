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

const popperAnimation: Variants = {
  initial: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
    x: 0,
    y: 0,
  },
  animate: {
    opacity: [0, 0, 0, 1, 1],
    scale: [0.3, 0.8, 1, 1.1, 1],
    pathLength: [0, 0.5, 1],
    pathOffset: [1, 0.5, 0],
    x: [-5, 0],
    y: [5, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

const animations = {
  default: {
    group: {
      initial: {
        x: 0,
        y: 0,
      },
      animate: {
        x: [-1, 1, 0],
        y: [1, -1, 0],
        scale: [1, 0.7, 1.1, 1],
        transformOrigin: 'bottom left',
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      },
    },
    path1: {},
    path2: {},
    path3: {
      initial: { opacity: 1, scale: 1, x: 0, y: 0 },
      animate: {
        opacity: [0, 0, 0, 1, 1],
        x: [-5, 0],
        y: [5, 0],
        scale: [0.5, 1, 1.2, 1],
        transition: {
          duration: 0.6,
        },
      },
    },
    path4: {
      initial: { opacity: 1, scale: 1, x: 0, y: 0 },
      animate: {
        opacity: [0, 0, 0, 1, 1],
        x: [-10, 0],
        y: [10, 0],
        scale: [0.5, 1, 1.2, 1],
        transition: {
          duration: 0.6,
        },
      },
    },
    path5: {
      initial: { opacity: 1, scale: 1, x: 0, y: 0 },
      animate: {
        opacity: [0, 0, 0, 1, 1],
        x: [-10, 0],
        y: [10, 0],
        scale: [0.5, 1, 1.2, 1],
        transition: {
          duration: 0.6,
        },
      },
    },
    path6: {
      initial: { opacity: 1, scale: 1, x: 0, y: 0 },
      animate: {
        opacity: [0, 0, 0, 1, 1],
        x: [-5, 0],
        y: [5, 0],
        scale: [0.5, 1, 1.2, 1],
        transition: {
          duration: 0.6,
        },
      },
    },
    path7: popperAnimation,
    path8: popperAnimation,
    path9: popperAnimation,
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
    <PartyPopper :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
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
      <motion.g :variants="variants.group" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.path
          d="M5.8 11.3 2 22l10.7-3.79"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
      </motion.g>
      <motion.path
        d="M4 3h.01"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M22 8h.01"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M15 2h.01"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M22 20h.01"
        :variants="variants.path6"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"
        :variants="variants.path7"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"
        :variants="variants.path8"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"
        :variants="variants.path9"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
