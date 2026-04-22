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
        x: 0,
        y: 0,
      },
      animate: {
        x: [
          0,
          '2%',
          '-2%',
          '2%',
          '-2%',
          '2%',
          '-2%',
          '2%',
          '-2%',
          '2%',
          '-2%',
          0,
        ],
        y: [
          0,
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          '-5%',
          0,
        ],
        transition: {
          ease: 'easeInOut',
          duration: 0.6,
        },
      },
    },
    circle: {},
    line1: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'bottom left',
        rotate: [0, 5, -5, 5, -5, 5, -5, 5, -5, 5, -5, 0],
        transition: { ease: 'easeInOut', duration: 0.6 },
      },
    },
    line2: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'top left',
        rotate: [0, 5, -5, 5, -5, 5, -5, 5, -5, 5, -5, 0],
        transition: { ease: 'easeInOut', duration: 0.6 },
      },
    },
    path1: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 0],
        transition: { ease: 'easeInOut', duration: 0.6 },
      },
    },
    path2: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 0],
        transition: { ease: 'easeInOut', duration: 0.6 },
      },
    },
    path3: {},
    path4: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: {
        x: 0,
        y: 0,
      },
      animate: {
        x: ['2%', '-2%', '2%', '-2%', '2%', '-2%', '2%', '-2%', '2%', '-2%'],
        y: '-5%',
        transition: {
          duration: 0.5,
          x: {
            repeat: Infinity,
            repeatType: 'loop',
          },
          y: {
            duration: 0.2,
          },
        },
      },
    },
    circle: {},
    line1: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'bottom left',
        rotate: [0, 10, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'loop' },
      },
    },
    line2: {
      initial: {
        rotate: 0,
      },
      animate: {
        transformOrigin: 'top left',
        rotate: [0, 10, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'loop' },
      },
    },
    path1: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'loop' },
      },
    },
    path2: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'loop' },
      },
    },
    path3: {},
    path4: {},
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
  >
    <AlarmClock :size="props.size" :strokeWidth="props.strokeWidth" />
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
      :variants="variants.group"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.circle
        :cx="12"
        :cy="13"
        :r="8"
        :variants="variants.circle"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="12"
        :y1="9"
        :x2="12"
        :y2="13"
        :variants="variants.line1"
        initial="initial"
        :animate="current"
      />
      <motion.line
        :x1="14"
        :y1="15"
        :x2="12"
        :y2="13"
        :variants="variants.line2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M5 3 2 6"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m22 6-3-3"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6.38 18.7 4 21"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M17.64 18.67 20 21"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
