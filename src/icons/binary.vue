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
    rect1: {
      initial: {
        x: 0,
      },
      animate: {
        x: -8,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },
    rect2: {
      initial: {
        x: 0,
      },
      animate: {
        x: 8,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },
    path1: {
      initial: {
        y: 0,
      },
      animate: {
        y: -10,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      },
    },
    path2: {
      initial: {
        y: 0,
      },
      animate: {
        y: 10,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <Binary :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
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
        :x="14"
        :y="14"
        :width="4"
        :height="6"
        :rx="2"
        :variants="variants.rect1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.rect
        :x="6"
        :y="4"
        :width="4"
        :height="6"
        :rx="2"
        :variants="variants.rect2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6 20h4 M6 14h2v6"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M14 4h2v6 M14 10h4"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
