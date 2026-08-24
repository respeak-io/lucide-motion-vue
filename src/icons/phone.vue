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
    "handset": {
      "initial": {
        "rotate": 0,
        "scale": 1
      },
      "animate": {
        "rotate": [
          0,
          -7,
          7,
          -4,
          3,
          0
        ],
        "scale": [
          1,
          1.03,
          1
        ],
        "transformOrigin": "12px 12px",
        "transition": {
          "duration": 0.86,
          "ease": "easeInOut"
        }
      }
    },
    "outerRing": {
      "initial": {
        "pathLength": 0,
        "opacity": 0
      },
      "animate": {
        "pathLength": [
          0,
          1
        ],
        "opacity": [
          0,
          1,
          0.9
        ],
        "transition": {
          "duration": 0.58,
          "delay": 0.18,
          "ease": "easeOut"
        }
      }
    },
    "innerRing": {
      "initial": {
        "pathLength": 0,
        "opacity": 0
      },
      "animate": {
        "pathLength": [
          0,
          1
        ],
        "opacity": [
          0,
          1,
          0.9
        ],
        "transition": {
          "duration": 0.46,
          "delay": 0.38,
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
    <Phone :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      :variants="variants.handset"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M13 2a9 9 0 0 1 9 9"
      :variants="variants.outerRing"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M13 6a5 5 0 0 1 5 5"
      :variants="variants.innerRing"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
