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

const snowAnimation: Variants = {
  initial: { opacity: 1 },
  animate: (i: number = 0) => ({
    opacity: [1, 0.4, 1],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: i * 0.2,
    },
  }),
};

const animations = {
  default: {
    group: {
      initial: {},
      animate: {},
    },
    path1: {},
    path2: snowAnimation,
    path3: snowAnimation,
    path4: snowAnimation,
    path5: snowAnimation,
    path6: snowAnimation,
    path7: snowAnimation,
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
    <CloudSnow :size="props.size" :strokeWidth="props.strokeWidth" />
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
        d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.g :variants="variants.group" initial="initial" :animate="current">
        <motion.path d="M8 15h.01" :variants="variants.path2" :custom="0" />
        <motion.path d="M12 21h.01" :variants="variants.path3" :custom="1" />
        <motion.path d="M16 15h.01" :variants="variants.path4" :custom="2" />
        <motion.path d="M12 17h.01" :variants="variants.path7" :custom="3" />
        <motion.path d="M16 19h.01" :variants="variants.path6" :custom="4" />
        <motion.path d="M8 19h.01" :variants="variants.path5" :custom="5" />
      </motion.g>
    </motion.svg>
</template>
