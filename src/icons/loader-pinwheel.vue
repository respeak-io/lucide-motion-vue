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
        rotate: 360,
        transition: {
          duration: 1.5,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        },
      },
    },
    circle: {},
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    group: {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 1,
      ease: "linear",
    },
  },
    },
    circle: {},
    path1: {},
    path2: {},
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
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
    :clip="props.clip"
  >
    <LoaderPinwheel :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <motion.circle
          :cx="12"
          :cy="12"
          :r="10"
          :variants="variants.circle"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
