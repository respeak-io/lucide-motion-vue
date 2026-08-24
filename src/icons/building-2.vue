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
    "windows": {
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
          "duration": 0.45,
          "delay": 0.3,
          "ease": "easeInOut",
          "opacity": {
            "duration": 0.08,
            "delay": 0.3
          }
        }
      }
    },
    "door": {
      "initial": {
        "y": 3,
        "opacity": 0
      },
      "animate": {
        "y": [
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
          "duration": 0.58,
          "delay": 0.38,
          "ease": "easeOut"
        }
      }
    },
    "wings": {
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
          "duration": 0.76,
          "delay": 0.12,
          "ease": "easeInOut",
          "opacity": {
            "duration": 0.08,
            "delay": 0.12
          }
        }
      }
    },
    "tower": {
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
          "duration": 0.9,
          "delay": 0,
          "ease": "easeInOut",
          "opacity": {
            "duration": 0.08,
            "delay": 0
          }
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
    <Building2 :size="props.size" :strokeWidth="props.strokeWidth" />
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
      d="M10 12h4"
      :variants="variants.windows"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    />
    <motion.path
      d="M10 8h4"
      :variants="variants.windows"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M14 21v-3a2 2 0 0 0-4 0v3"
      :variants="variants.door"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"
      :variants="variants.wings"
      initial="initial"
      :animate="current"
    />
    <motion.path
      d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"
      :variants="variants.tower"
      initial="initial"
      :animate="current"
    />
  </motion.svg>
</template>
