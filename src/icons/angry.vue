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

const EYEBROW_ROTATION = 20;

const DURATION = 0.6;

const animations = {
  default: {
    pathVariantsFace: {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.2, 1.2, 1.2, 1],
    rotate: [0, -3, 3, -1, 1, 0],
    transition: {
      duration: DURATION,
      times: [0, 0.2, 0.4, 0.6, 1],
      ease: "easeInOut",
    },
  },
},
    pathVariantsLeftEyebrow: {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, EYEBROW_ROTATION, 0],
    transition: {
      duration: DURATION + 0.2,
    },
  },
},
    pathVariantsRightEyebrow: {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -EYEBROW_ROTATION, 0],
    transition: {
      duration: DURATION + 0.2,
    },
  },
},
    pathVariantsEye: {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: DURATION,
    },
  },
},
    pathVariantsMouth: {
  initial: { translateY: 0 },
  animate: {
    translateY: [0, -0.5, 0],
    transition: {
      duration: DURATION,
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
  >
    <Angry :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
          :animate="current"
      @animationComplete="notifyComplete"
          fill="none"
          :height="props.size"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="props.strokeWidth"
          :variants="variants.pathVariantsFace"
          viewBox="0 0 24 24"
          :width="props.size"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <motion.path
            :animate="current"
            d="M16 16s-1.5-2-4-2-4 2-4 2"
            :variants="variants.pathVariantsMouth"
          />
          <motion.path
            :animate="current"
            d="M7.5 8 10 9"
            :variants="variants.pathVariantsLeftEyebrow"
          />
          <motion.path
            :animate="current"
            d="m14 9 2.5-1"
            :variants="variants.pathVariantsRightEyebrow"
          />
          <motion.path
            :animate="current"
            d="M9 10h.01"
            :variants="variants.pathVariantsEye"
          />
          <motion.path
            :animate="current"
            d="M15 10h.01"
            :variants="variants.pathVariantsEye"
          />
        </motion.svg>
</template>
