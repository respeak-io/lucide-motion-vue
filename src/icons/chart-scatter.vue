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
  default: (() => {
    const animation: Record<string, Variants> = {};

    for (let i = 1; i <= 5; i++) {
      animation[`circle${i}`] = {
        initial: { opacity: 1 },
        animate: {
          opacity: [0, 1],
          scale: [0, 1],
          transition: {
            ease: 'easeInOut',
            duration: 0.3,
            delay: (i - 1) * 0.3,
          },
        },
      };
    }

    return animation as Record<string, Variants>;
  })() satisfies Record<string, Variants>,
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
    <ChartScatter :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
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
        cx="7.5"
        cy="7.5"
        r=".5"
        :variants="variants.circle1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.circle
        cx="18.5"
        cy="5.5"
        r=".5"
        :variants="variants.circle2"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        cx="11.5"
        cy="11.5"
        r=".5"
        :variants="variants.circle3"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        cx="7.5"
        cy="16.5"
        r=".5"
        :variants="variants.circle4"
        initial="initial"
        :animate="current"
      />
      <motion.circle
        cx="17.5"
        cy="14.5"
        r=".5"
        :variants="variants.circle5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 3v16a2 2 0 0 0 2 2h16"
        :variants="variants.path"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
