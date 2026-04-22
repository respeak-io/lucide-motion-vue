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
            },
            animate: {
              x: [0, 0.5, -0.5, 0.3, -0.3, 0],
              transition: {
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              },
            },
          },
    path2: {
            initial: {
              rotate: 0,
              y: 0,
              transition: {
                duration: 0.5,
                ease: "linear",
              },
            },
            animate: {
              rotate: 360,
              y: [0, -0.3, 0, 0.3, 0],
              transition: {
                rotate: {
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                },
                y: {
                  duration: 0.3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <WashingMachine :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <motion.g
          :animate="current"
      @animationComplete="notifyComplete"
          :variants="variants.path"
        >
          <path d="M3 6h3" />
          <path d="M17 6h.01" />
          <rect height="20" rx="2" width="18" x="3" y="2" />
        </motion.g>
        <motion.g
          :animate="current"
          :variants="variants.path2"
        >
          <circle cx="12" cy="13" r="5" />
          <path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" />
        </motion.g>
      </motion.svg>
</template>
