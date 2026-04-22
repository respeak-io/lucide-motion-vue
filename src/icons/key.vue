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
        scale: 1,
        originX: '12px',
        originY: '12px',
      },
      animate: {
        rotate: [0, -20, 0],
        scale: [1, 0.95, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      },
    },
    stem: {},
    teeth: {},
    circle: {},
  } satisfies Record<string, Variants>,
  wiggle: {
    group: {
      initial: {
        rotate: 0,
        scale: 1,
        originX: '12px',
        originY: '12px',
      },
      animate: {
        rotate: [0, -10, 10, -10, 0],
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      },
    },
    stem: {},
    teeth: {},
    circle: {},
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    group: {
            initial: {
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 120,
                damping: 14,
                duration: 0.8,
              },
            },
            animate: {
              rotate: [-3, -33, -25, -28],
              transition: {
                duration: 0.6,
                times: [0, 0.6, 0.8, 1],
                ease: "easeInOut",
              },
            },
    },
    stem: {},
    teeth: {},
    circle: {},
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
    <Key :size="props.size" :strokeWidth="props.strokeWidth" />
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
          d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
          :variants="variants.stem"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m21 2-9.6 9.6"
          :variants="variants.teeth"
          initial="initial"
          :animate="current"
        />
        <motion.circle
          cx="7.5"
          cy="15.5"
          r="5.5"
          :variants="variants.circle"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
