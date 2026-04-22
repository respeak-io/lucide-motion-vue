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
        d: 'm19 5 3-3',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        d: 'm16 8 6-6',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: -3,
        y: 3,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path3: {
      initial: {
        d: 'm2 22 3-3',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        d: 'm2 22 6-6',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path4: {
      initial: {
        x: 0,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: 3,
        y: -3,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    path5: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: 3,
        y: -3,
        pathLength: [1, 0],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },
    path6: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: 3,
        y: -3,
        pathLength: [1, 0],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: {
        d: 'm19 5 3-3',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        d: ['m19 5 3-3', 'm16 8 6-6', 'm19 5 3-3'],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path2: {
      initial: {
        x: 0,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: [0, -3, 0],
        y: [0, 3, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path3: {
      initial: {
        d: 'm2 22 3-3',
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        d: ['m2 22 3-3', 'm2 22 6-6', 'm2 22 3-3'],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path4: {
      initial: {
        x: 0,
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: [0, 3, 0],
        y: [0, -3, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    path5: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: [0, 3, 0],
        y: [0, -3, 0],
        pathLength: [1, 0, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      },
    },
    path6: {
      initial: {
        x: 0,
        y: 0,
        pathLength: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        x: [0, 3, 0],
        y: [0, -3, 0],
        pathLength: [1, 0, 1],
        transition: {
          duration: 0.6,
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
    <Unplug :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="m19 5 3-3"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m2 22 3-3"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M7.5 13.5 10 11"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M10.5 16.5 13 14"
        :variants="variants.path6"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
