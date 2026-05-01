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
  type: "spring",
  stiffness: 150,
  damping: 15,
  mass: 0.3,
};

const animations = {
  default: {
    path: {
              initial: { x2: 21 },
              animate: { x2: 21 },
            },
    path2: {
              initial: { x2: 15 },
              animate: { x2: 19 },
            },
    path3: {
              initial: { x2: 17 },
              animate: { x2: 12 },
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
    <AlignLeft :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    style="user-select: none; -webkit-user-select: none"
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
          <motion.line
            :animate="current"
      @animationComplete="notifyComplete"
            :transition="DEFAULT_TRANSITION"
            :variants="variants.path"
            x1="3"
            x2="21"
            y1="6"
            y2="6"
          />

          <motion.line
            :animate="current"
            :transition="DEFAULT_TRANSITION"
            :variants="variants.path2"
            x1="3"
            x2="15"
            y1="12"
            y2="12"
          />

          <motion.line
            :animate="current"
            :transition="DEFAULT_TRANSITION"
            :variants="variants.path3"
            x1="3"
            x2="17"
            y1="18"
            y2="18"
          />
        </motion.svg>
</template>
