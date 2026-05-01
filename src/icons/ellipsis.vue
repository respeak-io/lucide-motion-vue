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
        transition: { type: 'spring', stiffness: 60, damping: 10 },
      },
      animate: {
        rotate: 180,
        transition: { type: 'spring', stiffness: 60, damping: 10 },
      },
    },
    circle1: {},
    circle2: {},
    circle3: {},
  } satisfies Record<string, Variants>,
  vertical: {
    group: {
      initial: {
        rotate: 0,
        transition: { type: 'spring', stiffness: 100, damping: 12 },
      },
      animate: {
        rotate: 90,
        transition: { type: 'spring', stiffness: 100, damping: 12 },
      },
    },
    circle1: {},
    circle2: {},
    circle3: {},
  } satisfies Record<string, Variants>,
  jump: {
    group: {},
    circle1: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -2, 2],
        transition: {
          duration: 1.2,
          delay: 0.4,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
    circle2: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -2, 2],
        transition: {
          duration: 1.2,
          delay: 0.2,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
    circle3: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, -2, 2],
        transition: {
          duration: 1.2,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
  pulse: {
    group: {},
    circle1: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.5, 1],
        transition: {
          duration: 1,
          delay: 0.4,
          ease: 'easeInOut',
        },
      },
    },
    circle2: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.5, 1],
        transition: {
          duration: 1,
          delay: 0.2,
          ease: 'easeInOut',
        },
      },
    },
    circle3: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 1.5, 1],
        transition: {
          duration: 1,
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
    <Ellipsis :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    style="user-select: none; -webkit-user-select: none"
      xmlns="http://www.w3.org/2000/svg"
      :width="props.size"
      :height="props.size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="props.strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :variants="variants.group"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.circle
        :cx="19"
        :cy="12"
        :r="1"
        :variants="variants.circle1"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        :cx="12"
        :cy="12"
        :r="1"
        :variants="variants.circle2"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        :cx="5"
        :cy="12"
        :r="1"
        :variants="variants.circle3"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
