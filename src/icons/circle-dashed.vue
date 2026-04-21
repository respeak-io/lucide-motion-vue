<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: `normal` → `initial`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
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

const VFOR_LIST_1 = [
          "M10.1 2.182a10 10 0 0 1 3.8 0",
          "M13.9 21.818a10 10 0 0 1-3.8 0",
          "M17.609 3.721a10 10 0 0 1 2.69 2.7",
          "M2.182 13.9a10 10 0 0 1 0-3.8",
          "M20.279 17.609a10 10 0 0 1-2.7 2.69",
          "M21.818 10.1a10 10 0 0 1 0 3.8",
          "M3.721 6.391a10 10 0 0 1 2.7-2.69",
          "M6.391 20.279a10 10 0 0 1-2.69-2.7",
        ];

const animations = {
  default: {
    path: {
  initial: { opacity: 1 },
  animate: (i: number) => ({
    opacity: [0, 1],
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
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
  >
    <CircleDashed :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
        fill="none"
        :height="props.size"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="props.strokeWidth"
        viewBox="0 0 24 24"
        :width="props.size"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
      v-for="(d, index) in VFOR_LIST_1"
      :key="d"
            :animate="current"
      @animationComplete="notifyComplete"
            :custom="index + 1"
            :d="d"
            :variants="variants.path"
          />
      </motion.svg>
</template>
