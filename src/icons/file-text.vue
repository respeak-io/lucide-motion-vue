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
            initial: { scale: 1 },
            animate: {
              scale: 1.05,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
          },
    path2: {
              initial: {
                pathLength: 1,
                x1: 8,
                x2: 10,
              },
              animate: {
                pathLength: [1, 0, 1],
                x1: [8, 10, 8],
                x2: [10, 10, 10],
                transition: {
                  duration: 0.7,
                  delay: 0.3,
                },
              },
            },
    path3: {
              initial: {
                pathLength: 1,
                x1: 8,
                x2: 16,
              },
              animate: {
                pathLength: [1, 0, 1],
                x1: [8, 16, 8],
                x2: [16, 16, 16],
                transition: {
                  duration: 0.7,
                  delay: 0.5,
                },
              },
            },
    path4: {
              initial: {
                pathLength: 1,
                x1: 8,
                x2: 16,
              },
              animate: {
                pathLength: [1, 0, 1],
                x1: [8, 16, 8],
                x2: [16, 16, 16],
                transition: {
                  duration: 0.7,
                  delay: 0.7,
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
    :triggerTarget="props.triggerTarget"
  >
    <FileText :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
          :animate="current"
      @animationComplete="notifyComplete"
          fill="none"
          :height="props.size"
          initial="initial"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="props.strokeWidth"
          :variants="variants.path"
          viewBox="0 0 24 24"
          :width="props.size"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />

          <motion.path
            d="M10 9H8"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            :variants="variants.path2"
          />
          <motion.path
            d="M16 13H8"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            :variants="variants.path3"
          />
          <motion.path
            d="M16 17H8"
            stroke="currentColor"
            :stroke-width="props.strokeWidth"
            :variants="variants.path4"
          />
        </motion.svg>
</template>
