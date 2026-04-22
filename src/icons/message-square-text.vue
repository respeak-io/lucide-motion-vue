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
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'bottom left',
        rotate: [0, 8, -8, 2, 0],
        transition: {
          ease: 'easeInOut',
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
        },
      },
    },
    path1: {},
    path2: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [1, 0, 1],
        pathLength: [1, 0, 1],
        pathOffset: [0, 1, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
        },
      },
    },
    path3: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [1, 0, 1],
        pathLength: [1, 0, 1],
        pathOffset: [0, 1, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
        },
      },
    },
  } satisfies Record<string, Variants>,
  write: {
    group: {},
    path1: {},
    path2: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [0, 1],
        pathLength: [0, 1],
        pathOffset: [1, 0],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
        },
      },
    },
    path3: {
      initial: {
        opacity: 1,
        pathLength: 1,
        pathOffset: 0,
      },
      animate: {
        opacity: [0, 1],
        pathLength: [0, 1],
        pathOffset: [1, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          opacity: { duration: 0.01 },
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
    <MessageSquareText :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.g :variants="variants.group" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M13 8H7"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M17 12H7"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
