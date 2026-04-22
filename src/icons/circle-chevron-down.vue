<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: `normal` → `initial`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
import { computed } from 'vue'
import { motion, type Transition, type Variants } from 'motion-v'
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

const DEFAULT_TRANSITION: Transition  = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const animations = {
  default: {
    path: {
            initial: { y: 0 },
            animate: {
              y: [0, 2, 0],
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
    <CircleChevronDown :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <circle cx="12" cy="12" r="10" />
        <motion.path
          :animate="current"
      @animationComplete="notifyComplete"
          d="m16 10-4 4-4-4"
          :transition="DEFAULT_TRANSITION"
          :variants="variants.path"
        />
      </motion.svg>
</template>
