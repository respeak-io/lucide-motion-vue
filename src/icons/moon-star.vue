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
    path1: {
      initial: {
        rotate: 0,
        transition: { duration: 0 },
      },
      animate: {
        rotate: [0, -30, 400, 360],
        transition: {
          duration: 1.2,
          times: [0, 0.25, 0.75, 1],
          ease: ['easeInOut', 'easeInOut', 'easeInOut'],
        },
      },
    },
    group: {
      initial: {
        scale: 1,
        rotate: 0,
        y: 0,
        x: 0,
      },
      animate: {
        scale: [1, 0, 0, 1],
        rotate: [0, 90, 90, 0],
        y: [0, 6, 10, 0],
        x: [0, -10, -6, 0],
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
          times: [0, 0.25, 0.65, 1],
        },
      },
    },
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
  >
    <MoonStar :size="props.size" :strokeWidth="props.strokeWidth" />
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
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.g :variants="variants.group" initial="initial" :animate="current">
        <motion.path
          d="M18 5h4"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M20 3v4"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
