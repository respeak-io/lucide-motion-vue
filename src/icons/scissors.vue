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
    group1: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, -26, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      },
    },
    group2: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 26, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      },
    },
    path1: {},
    path2: {},
    path3: {},
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
    <Scissors :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.g :variants="variants.group1" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.circle
          cx="6"
          cy="6"
          r="3"
          :variants="variants.circle1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M8.12 8.12 12 12"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M14.8 14.8 20 20"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
      </motion.g>
      <motion.g :variants="variants.group2" initial="initial" :animate="current">
        <motion.circle
          cx="6"
          cy="18"
          r="3"
          :variants="variants.circle2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M20 4 8.12 15.88"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
