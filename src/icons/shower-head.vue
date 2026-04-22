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

const DROP_PATH = [
  { id: "drop1", d: "M14 17v.01" },
  { id: "drop2", d: "M10 16v.01" },
  { id: "drop3", d: "M13 13v.01" },
  { id: "drop4", d: "M16 10v.01" },
  { id: "drop5", d: "M11 20v.01" },
  { id: "drop6", d: "M17 14v.01" },
  { id: "drop7", d: "M20 11v.01" },
];

const animations = {
  default: {
    drop: {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
},
    dropChild: {
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: [1, 0.2, 1],
    transition: {
      duration: 1,
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
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
    :clip="props.clip"
    :triggerTarget="props.triggerTarget"
  >
    <ShowerHead :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <path d="m4 4 2.5 2.5" />
          <path d="M13.5 6.5a4.95 4.95 0 0 0-7 7" />
          <path d="M15 5 5 15" />
          <motion.g
            :animate="current"
      @animationComplete="notifyComplete"
            initial="initial"
            :variants="variants.drop"
          >
            <motion.path
      v-for="path in DROP_PATH"
      :key="path.id"
                :d="path.d"
                :variants="variants.dropChild"
              />
          </motion.g>
        </motion.svg>
</template>
