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

const SPEED_LINES = [
  { x1: 5, y1: 15, x2: 1, y2: 19, delay: 0.1 },
  { x1: 7, y1: 17, x2: 3, y2: 21, delay: 0.2 },
  { x1: 9, y1: 19, x2: 5, y2: 23, delay: 0.3 },
];

const animations = {
  default: {
    path: {
              initial: { x: 0, y: 0, scale: 1 },
              animate: {
                x: 3,
                y: -3,
                scale: 0.8,
              },
            },
    path2: {
                initial: {
                  pathOffset: [0, 1],
                  translateX: -3,
                  translateY: 3,
                  opacity: 0,
                  transition: {
                    duration: 0.3,
                    times: [0, 0.6, 1],
                  },
                },
                animate: {
                  pathOffset: [1, 2],
                  translateX: [0, 0],
                  translateY: [0, 0],
                  opacity: 1,
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
    <Airplane :size="props.size" :strokeWidth="props.strokeWidth" />
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
            d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
            :transition="{
              duration: 0.5,
            }"
            :variants="variants.path"
          />
          <motion.line
      v-for="(line, index) in SPEED_LINES"
      :key="index"
              :animate="current"
              stroke="currentColor"
              :stroke-width="props.strokeWidth"
              :transition="{ duration: 0.15, delay: line.delay }"
              :variants="variants.path2"
              :x1="line.x1"
              :x2="line.x2"
              :y1="line.y1"
              :y2="line.y2"
            />
        </motion.svg>
</template>
