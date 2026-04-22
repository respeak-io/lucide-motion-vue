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
        transition: { type: 'spring', stiffness: 150, damping: 25 },
      },
      animate: {
        rotate: -45,
        transition: { type: 'spring', stiffness: 150, damping: 25 },
      },
    },
    arrowArc: {},
    arrowHead: {},
    keyPart1: {},
    keyPart2: {},
    circle: {},
  } satisfies Record<string, Variants>,
  rotate: {
    group: {
      initial: {
        rotate: 0,
        transition: { type: 'spring', stiffness: 150, damping: 25 },
      },
      animate: {
        rotate: -360,
        transition: { type: 'spring', stiffness: 150, damping: 25 },
      },
    },
    arrowArc: {},
    arrowHead: {},
    keyPart1: {},
    keyPart2: {},
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <RotateCcwKey :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.path
        d="m14.5 9.5 1 1"
        :variants="variants.keyPart1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m15.5 8.5-4 4"
        :variants="variants.keyPart2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8"
        :variants="variants.arrowArc"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 3v5h5"
        :variants="variants.arrowHead"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        cx="10"
        cy="14"
        r="2"
        :variants="variants.circle"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
