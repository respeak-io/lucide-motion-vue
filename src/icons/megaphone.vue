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
    "horn": {
      "initial": {
        "scaleX": 1,
        "pathLength": 1
      },
      "animate": {
        "scaleX": [
          1,
          1.08,
          0.98,
          1
        ],
        "pathLength": [
          0.2,
          1
        ],
        "transformOrigin": "3px 10px",
        "transition": {
          "duration": 0.78,
          "ease": "easeOut"
        }
      }
    },
    "handle": {
      "initial": {
        "rotate": 0,
        "y": 0
      },
      "animate": {
        "rotate": [
          0,
          -5,
          2,
          0
        ],
        "y": [
          0,
          1.2,
          0
        ],
        "transformOrigin": "8px 14px",
        "transition": {
          "duration": 0.88,
          "delay": 0.12,
          "ease": "easeInOut"
        }
      }
    },
    "rim": {
      "initial": {
        "scaleY": 0.5,
        "opacity": 0.4
      },
      "animate": {
        "scaleY": [
          0.5,
          1.2,
          1
        ],
        "opacity": [
          0.4,
          1,
          1
        ],
        "transformOrigin": "8px 10px",
        "transition": {
          "duration": 0.46,
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
    <Megaphone :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
      :variants="variants.horn"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"
      :variants="variants.handle"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M8 6v8"
      :variants="variants.rim"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
