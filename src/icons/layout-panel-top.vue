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
            initial: { opacity: 1, translateY: 0 },
            animate: {
              opacity: [0, 1],
              translateY: [-5, 0],
              transition: {
                opacity: { duration: 0.5, times: [0.2, 1] },
                duration: 0.5,
              },
            },
          },
    path2: {
            initial: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [-10, 0],
              transition: {
                opacity: { duration: 0.7, times: [0.5, 1] },
                translateX: { delay: 0.3 },
                duration: 0.5,
              },
            },
          },
    path3: {
            initial: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [10, 0],
              transition: {
                opacity: { duration: 0.8, times: [0.5, 1] },
                translateX: { delay: 0.4 },
                duration: 0.5,
              },
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
  >
    <LayoutPanelTop :size="props.size" :strokeWidth="props.strokeWidth" />
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
          :variants="variants.path"
          width="18"
          x="3"
          y="3"
        />
        <motion.rect
          :animate="current"
          height="7"
          initial="initial"
          rx="1"
          :variants="variants.path2"
          width="7"
          x="3"
          y="14"
        />
        <motion.rect
          :animate="current"
          height="7"
          initial="initial"
          rx="1"
          :variants="variants.path3"
          width="7"
          x="14"
          y="14"
        />
      </motion.svg>
</template>
