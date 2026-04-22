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

const animations = {
  default: {
    g: {
  initial: { rotate: 0 },
  animate: { rotate: 180 },
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
  >
    <FileCog :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
        fill="none"
        height="28"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="props.strokeWidth"
        viewBox="0 0 24 24"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M4.677 21.5a2 2 0 0 0 1.313.5H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2.5" />
        <motion.g
          :animate="current"
      @animationComplete="notifyComplete"
          :transition="{ type: 'spring', stiffness: 50, damping: 10 }"
          :variants="variants.g"
        >
          <path d="m3.2 12.9-.9-.4" />
          <path d="m3.2 15.1-.9.4" />
          <path d="m4.9 11.2-.4-.9" />
          <path d="m4.9 16.8-.4.9" />
          <path d="m7.5 10.3-.4.9" />
          <path d="m7.5 17.7-.4-.9" />
          <path d="m9.7 12.5-.9.4" />
          <path d="m9.7 15.5-.9-.4" />
          <circle cx="6" cy="14" r="3" />
        </motion.g>
      </motion.svg>
</template>
