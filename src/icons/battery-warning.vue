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
            initial: { opacity: 1, scale: 1 },
            animate: {
              opacity: [1, 0.4, 1],
              scale: [1, 1.1, 1],
              transition: {
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
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
    <BatteryWarning :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <path d="M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
        <path d="M22 14v-4" />
        <path d="M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />

        <motion.g
          :animate="current"
      @animationComplete="notifyComplete"
          initial="initial"
          :style="{ originX: '50%', originY: '50%' }"
          :variants="variants.path"
        >
          <path d="M10 17h.01" />
          <path d="M10 7v6" />
        </motion.g>
      </motion.svg>
</template>
