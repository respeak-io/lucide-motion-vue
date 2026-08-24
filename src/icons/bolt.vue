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
    "shell": {
      "initial": {
        "rotate": 0,
        "pathLength": 1
      },
      "animate": {
        "rotate": [
          0,
          -4,
          3,
          0
        ],
        "pathLength": [
          0.2,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.82,
          "ease": "easeInOut"
        }
      }
    },
    "core": {
      "initial": {
        "rotate": 0,
        "scale": 1
      },
      "animate": {
        "rotate": [
          0,
          100,
          180
        ],
        "scale": [
          1,
          0.82,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.95,
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
    <Bolt :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      :variants="variants.shell"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.circle
      cx="12"
      cy="12"
      r="4"
      :variants="variants.core"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
