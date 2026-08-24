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
    "shield": {
      "initial": {
        "pathLength": 1,
        "opacity": 1
      },
      "animate": {
        "pathLength": [
          0,
          1
        ],
        "opacity": [
          0,
          1
        ],
        "transition": {
          "duration": 0.86,
          "delay": 0,
          "ease": "easeInOut",
          "opacity": {
            "duration": 0.08,
            "delay": 0
          }
        }
      }
    },
    "horizontal": {
      "initial": {
        "scaleX": 0,
        "opacity": 0
      },
      "animate": {
        "scaleX": [
          0,
          1.2,
          1
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.42,
          "delay": 0.36,
          "ease": "easeOut"
        }
      }
    },
    "vertical": {
      "initial": {
        "scaleY": 0,
        "opacity": 0
      },
      "animate": {
        "scaleY": [
          0,
          1.2,
          1
        ],
        "opacity": [
          0,
          1,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.5,
          "delay": 0.5,
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
    <ShieldPlus :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      :variants="variants.shield"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M9 12h6"
      :variants="variants.horizontal"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M12 9v6"
      :variants="variants.vertical"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
