<script setup lang="ts">
// Auto-generated from animate-ui upstream by scripts/port-icons.mjs.
// Variants and SVG geometry adapted from animate-ui (MIT + Commons Clause).
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
    circle: {},
    path: {
      initial: { rotate: 0 },
      animate: {
        rotate: 180,
        transformOrigin: 'left center',
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 10,
        },
      },
    },
  } satisfies Record<string, Variants>,
  rotate: {
    circle: {},
    path: {
      initial: { rotate: 0 },
      animate: {
        rotate: 360,
        transformOrigin: 'left center',
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 10,
        },
      },
    },
  } satisfies Record<string, Variants>,
  'lucide-animated': {
    circle: {},
    path: {
  initial: { rotate: 0 },
  animate: {
    rotate: 180,
    transformOrigin: "left center",
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 12,
    },
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
    :triggerTarget="props.triggerTarget"
  >
    <Contrast :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.circle
        :cx="12"
        :cy="12"
        :r="10"
        :variants="variants.circle"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M12 18a6 6 0 0 0 0-12v12z"
        :variants="variants.path"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
