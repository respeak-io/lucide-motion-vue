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
    "body": {
      "initial": {
        "rotate": 0,
        "scale": 1
      },
      "animate": {
        "rotate": [
          0,
          -7,
          4,
          -2,
          0
        ],
        "scale": [
          1,
          1.04,
          1
        ],
        "transformOrigin": "7.5px 7.5px",
        "transition": {
          "duration": 0.92,
          "ease": "easeInOut"
        }
      }
    },
    "hole": {
      "initial": {
        "scale": 1,
        "opacity": 1
      },
      "animate": {
        "scale": [
          1,
          1.8,
          0.8,
          1
        ],
        "opacity": [
          1,
          0.45,
          1,
          1
        ],
        "transformOrigin": "7.5px 7.5px",
        "transition": {
          "duration": 0.62,
          "delay": 0.16,
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
    <Tag :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      :variants="variants.body"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.circle
      cx="7.5"
      cy="7.5"
      r="0.5"
      fill="currentColor"
      :variants="variants.hole"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
