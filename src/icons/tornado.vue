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
    path: {
  initial: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: (custom: number) => ({
    x: [0, custom * 1, 0],
    opacity: 1,
    transition: {
      x: {
        duration: 0.6,
        repeat: 1,
        ease: "easeInOut",
        delay: custom * 0.1,
      },
    },
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <Tornado :size="props.size" :strokeWidth="props.strokeWidth" />
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
            :animate="current"
      @animationComplete="notifyComplete"
            :custom="1"
            d="M21 4H3"
            initial="initial"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            :custom="2"
            d="M18 8H6"
            initial="initial"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            :custom="3"
            d="M19 12H9"
            initial="initial"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            :custom="4"
            d="M16 16h-6"
            initial="initial"
            :variants="variants.path"
          />
          <motion.path
            :animate="current"
            :custom="5"
            d="M11 20H9"
            initial="initial"
            :variants="variants.path"
          />
        </motion.svg>
</template>
