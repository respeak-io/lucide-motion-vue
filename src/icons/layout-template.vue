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
    "header": {
      "initial": {
        "y": -3,
        "opacity": 0
      },
      "animate": {
        "y": [
          -3,
          0.5,
          0
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transition": {
          "duration": 0.55,
          "ease": "easeOut"
        }
      }
    },
    "main": {
      "initial": {
        "x": -3,
        "opacity": 0
      },
      "animate": {
        "x": [
          -3,
          0.5,
          0
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transition": {
          "duration": 0.62,
          "delay": 0.16,
          "ease": "easeOut"
        }
      }
    },
    "aside": {
      "initial": {
        "x": 3,
        "opacity": 0
      },
      "animate": {
        "x": [
          3,
          -0.5,
          0
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transition": {
          "duration": 0.72,
          "delay": 0.28,
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
    <LayoutTemplate :size="props.size" :strokeWidth="props.strokeWidth" />
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
    <motion.rect
      width="18"
      height="7"
      x="3"
      y="3"
      rx="1"
      :variants="variants.header"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.rect
      width="9"
      height="7"
      x="3"
      y="14"
      rx="1"
      :variants="variants.main"
      initial="initial"
      :animate="current"
    />
    <motion.rect
      width="5"
      height="7"
      x="16"
      y="14"
      rx="1"
      :variants="variants.aside"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
