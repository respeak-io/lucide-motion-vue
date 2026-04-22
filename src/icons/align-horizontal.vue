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
  stiffness: 160,
  damping: 17,
  mass: 1,
};

const animations = {
  default: {
    path: {
            initial: { scaleX: 1 },
            animate: { scaleX: 0.85 },
          },
    path2: {
            initial: { translateX: 0, scaleY: 1 },
            animate: {
              translateX: 2,
              scaleY: 0.9,
            },
          },
    path3: {
            initial: { translateX: 0, scaleY: 1 },
            animate: {
              translateX: -2,
              scaleY: 0.9,
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
    <AlignHorizontal :size="props.size" :strokeWidth="props.strokeWidth" />
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
          height="10"
          rx="2"
          :transition="DEFAULT_TRANSITION"
          :variants="variants.path"
          width="6"
          x="9"
          y="7"
        />
        <motion.path
          :animate="current"
          d="M4 22V2"
          :transition="DEFAULT_TRANSITION"
          :variants="variants.path2"
        />
        <motion.path
          :animate="current"
          d="M20 22V2"
          :transition="DEFAULT_TRANSITION"
          :variants="variants.path3"
        />
      </motion.svg>
</template>
