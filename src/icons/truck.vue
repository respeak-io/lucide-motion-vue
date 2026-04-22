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

const VFOR_LIST_1 = [
            { y: 8, width: 5, x: 0 },
            { y: 11, width: 7, x: -1 },
            { y: 14, width: 4, x: 0 },
          ];

const animations = {
  default: {
    truck: {
  initial: { x: 0, y: 0 },
  animate: {
    y: [0, -1, 0, -0.5, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "loop",
    },
  },
},
    wheel: {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 0.5,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
    },
  },
},
    speedLine: {
  initial: {
    opacity: 0,
    x: 0,
    scaleX: 0,
  },
  animate: (custom: number) => ({
    opacity: [0, 0.7, 0.5, 0],
    x: [0, -4, -10, -16],
    scaleX: [0.2, 1, 0.8, 0.3],
    transition: {
      duration: 0.5,
      ease: "easeOut",
      repeat: Number.POSITIVE_INFINITY,
      delay: custom * 0.08,
      times: [0, 0.2, 0.6, 1],
    },
  }),
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
    <Truck :size="props.size" :strokeWidth="props.strokeWidth" />
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
          <motion.line
      v-for="(line, i) in VFOR_LIST_1"
      :key="`speed-${i}`"
              :animate="current"
      @animationComplete="notifyComplete"
              :custom="i"
              initial="initial"
              stroke-linecap="round"
              :stroke-width="props.strokeWidth"
              :variants="variants.speedLine"
              :x1="line.x"
              :x2="line.x + line.width"
              :y1="line.y"
              :y2="line.y"
            />

          <motion.g
            :animate="current"
            initial="initial"
            :variants="variants.truck"
          >
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          </motion.g>

          <motion.g
            :animate="current"
            initial="initial"
            :variants="variants.truck"
          >
            <motion.g
              :animate="current"
              initial="initial"
              :style="{ transformOrigin: '7px 18px' }"
              :variants="variants.wheel"
            >
              <circle cx="7" cy="18" r="2" />
              <line :stroke-width="props.strokeWidth" x1="7" x2="7" y1="16.5" y2="19.5" />
              <line :stroke-width="props.strokeWidth" x1="5.5" x2="8.5" y1="18" y2="18" />
            </motion.g>
          </motion.g>

          <motion.g
            :animate="current"
            initial="initial"
            :variants="variants.truck"
          >
            <motion.g
              :animate="current"
              initial="initial"
              :style="{ transformOrigin: '17px 18px' }"
              :variants="variants.wheel"
            >
              <circle cx="17" cy="18" r="2" />
              <line :stroke-width="props.strokeWidth" x1="17" x2="17" y1="16.5" y2="19.5" />
              <line :stroke-width="props.strokeWidth" x1="15.5" x2="18.5" y1="18" y2="18" />
            </motion.g>
          </motion.g>
        </motion.svg>
</template>
