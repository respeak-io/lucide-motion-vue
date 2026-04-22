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
    group: {
      initial: {
        rotate: 0,
        y: 0,
        x: 0,
      },
      animate: {
        rotate: [0, -20, -20, 15, 15, 0],
        y: [0, -0.5, -0.5, 0, 0, 0],
        x: [0, 0, 0, 0.5, 0.5, 0],
        transition: {
          duration: 1.8,
          ease: 'easeInOut',
        },
      },
    },
    path1: {},
    path2: {},
    path3: {
      initial: {
        opacity: 1,
      },
      animate: {
        opacity: [1, 0, 1, 0, 1, 0, 1],
        transition: {
          duration: 1.8,
          ease: 'easeInOut',
        },
      },
    },
    path4: {},
    path5: {},
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
  >
    <Cctv :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.g :variants="variants.group" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.path
          d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M7 9h.01"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
      </motion.g>

      <motion.path
        d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />

      <motion.path
        d="M2 21v-4"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
