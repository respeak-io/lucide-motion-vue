<script setup lang="ts">
// Hand-ported from pqoqubbw/icons (MIT). Variants and SVG geometry adapted
// from https://github.com/pqoqubbw/icons/blob/main/icons/archive.tsx.
// Adapted to our AnimateIcon context: `normal` → `initial`.
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

const rectTransition = {
  duration: 0.2,
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
}

const animations = {
  default: {
    rect: {
      initial: { translateY: 0, transition: rectTransition },
      animate: { translateY: -1.5, transition: rectTransition },
    },
    body: {
      initial: { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8' },
      animate: { d: 'M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11' },
    },
    slot: {
      initial: { d: 'M10 12h4' },
      animate: { d: 'M10 15h4' },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    rect: {
  initial: {
    translateY: 0,
    transition: {
      duration: 0.2,
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
  animate: {
    translateY: -1.5,
    transition: {
      duration: 0.2,
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
    },
    body: {
  initial: { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" },
  animate: { d: "M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11" },
    },
    slot: {
  initial: { d: "M10 12h4" },
  animate: { d: "M10 15h4" },
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
    <Archive :size="props.size" :strokeWidth="props.strokeWidth" />
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
    <motion.rect
      :width="20"
      :height="5"
      :x="2"
      :y="3"
      :rx="1"
      :variants="variants.rect"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"
      :variants="variants.body"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M10 12h4"
      :variants="variants.slot"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
