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
    rect_1: {
  initial: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 11, 11, 0],
    translateY: [0, 0, 0, 0],
    transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 0.6, 1] },
  },
},
    rect_2: {
  initial: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 0, 0, 0],
    translateY: [0, 11, 11, 0],
    transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 0.6, 1] },
  },
},
    rect_3: {
  initial: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, -11, -11, 0],
    translateY: [0, 0, 0, 0],
    transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 0.6, 1] },
  },
},
    rect_4: {
  initial: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 0, 0, 0],
    translateY: [0, -11, -11, 0],
    transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 0.6, 1] },
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
    <LayoutGrid :size="props.size" :strokeWidth="props.strokeWidth" />
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
            height="7"
            initial="initial"
            rx="1"
            :variants="variants.rect_1"
            width="7"
            x="3"
            y="3"
          />
          <motion.rect
            :animate="current"
            height="7"
            initial="initial"
            rx="1"
            :variants="variants.rect_2"
            width="7"
            x="14"
            y="3"
          />
          <motion.rect
            :animate="current"
            height="7"
            initial="initial"
            rx="1"
            :variants="variants.rect_3"
            width="7"
            x="14"
            y="14"
          />
          <motion.rect
            :animate="current"
            height="7"
            initial="initial"
            rx="1"
            :variants="variants.rect_4"
            width="7"
            x="3"
            y="14"
          />
        </motion.svg>
</template>
