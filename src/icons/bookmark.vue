<script setup lang="ts">
// Hand-ported from pqoqubbw/icons (MIT). Variants and SVG geometry adapted
// from https://github.com/pqoqubbw/icons/blob/main/icons/bookmark.tsx.
// Adapted to our AnimateIcon context: `normal` → `initial`.
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
    // Upstream uses scaleY 1.3 which clips against the 24×24 viewBox — the
    // bookmark path spans y=3..22 so a 30% Y-stretch from center reaches the
    // edges. Softened to 1.18 / 0.93 to preserve the bounce feel without
    // touching the frame.
    path: {
      initial: { scaleY: 1, scaleX: 1 },
      animate: {
        scaleY: [1, 1.18, 0.94, 1.03, 1],
        scaleX: [1, 0.94, 1.06, 0.97, 1],
        transition: { duration: 0.6, ease: 'easeOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    path: {
  initial: { scaleY: 1, scaleX: 1 },
  animate: {
    scaleY: [1, 1.3, 0.9, 1.05, 1],
    scaleX: [1, 0.9, 1.1, 0.95, 1],
    transition: {
      duration: 0.6,
      ease: "easeOut",
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
    <Bookmark :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <motion.path
      d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
      :style="{ originY: 0.5, originX: 0.5 }"
      :variants="variants.path"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
  </motion.svg>
</template>
