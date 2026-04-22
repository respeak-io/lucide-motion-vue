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
    square: {
  initial: { transition: { duration: 0.4 } },
  animate: { transition: { duration: 0.6, ease: "easeInOut" } },
},
    path: {
  initial: { d: "m8 12 4 4 4-4", translateY: 0, opacity: 1 },
  animate: {
    d: "m8 12 4 4 4-4",
    translateY: [0, -3, 0],
    transition: { duration: 0.4 },
  },
},
    secondPath: {
  initial: { d: "M12 8v8", opacity: 1 },
  animate: {
    d: ["M12 8v8", "M12 8v5", "M12 8v8"],
    transition: { duration: 0.4 },
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
    <SquareArrowDown :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <motion.rect
          :animate="current"
      @animationComplete="notifyComplete"
          height="18"
          initial="initial"
          rx="2"
          :variants="variants.square"
          width="18"
          x="3"
          y="3"
        />
        <motion.path
          :animate="current"
          d="m8 12 4 4 4-4"
          initial="initial"
          :variants="variants.path"
        />
        <motion.path
          :animate="current"
          d="M12 8v8"
          initial="initial"
          :variants="variants.secondPath"
        />
      </motion.svg>
</template>
