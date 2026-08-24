<script setup lang="ts">
// Hand-written semantic animation. SVG geometry from Lucide (ISC).
// Safe to hand-edit — upstream port scripts preserve hand-written icons.
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
    "frame": {
      "initial": {
        "scale": 0.88,
        "opacity": 0.45
      },
      "animate": {
        "scale": [
          0.88,
          1.05,
          1
        ],
        "opacity": [
          0.45,
          1,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.72,
          "ease": "easeOut"
        }
      }
    },
    "first": {
      "initial": {
        "x": -4,
        "y": -2,
        "opacity": 0
      },
      "animate": {
        "x": [
          -4,
          0.6,
          0
        ],
        "y": [
          -2,
          0,
          0
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transition": {
          "duration": 0.56,
          "delay": 0.18,
          "ease": "easeOut"
        }
      }
    },
    "second": {
      "initial": {
        "x": 4,
        "y": 2,
        "opacity": 0
      },
      "animate": {
        "x": [
          4,
          -0.6,
          0
        ],
        "y": [
          2,
          0,
          0
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transition": {
          "duration": 0.68,
          "delay": 0.3,
          "ease": "easeOut"
        }
      }
    }
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
    <Group :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
    style="user-select: none; -webkit-user-select: none"
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
      d="M3 7V5c0-1.1.9-2 2-2h2"
      :variants="variants.frame"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M17 3h2c1.1 0 2 .9 2 2v2"
      :variants="variants.frame"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M21 17v2c0 1.1-.9 2-2 2h-2"
      :variants="variants.frame"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M7 21H5c-1.1 0-2-.9-2-2v-2"
      :variants="variants.frame"
      initial="initial"
      :animate="current"
    />
    <motion.rect
      width="7"
      height="5"
      x="7"
      y="7"
      rx="1"
      :variants="variants.first"
      initial="initial"
      :animate="current"
    />
    <motion.rect
      width="7"
      height="5"
      x="10"
      y="12"
      rx="1"
      :variants="variants.second"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
