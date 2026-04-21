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
    const animation: Record<string, Variants> = {
      rect: {},
      path3: {
        initial: { opacity: 1 },
        animate: {
          opacity: [1, 0, 1, 0, 1],
          transition: {
            duration: 0.8,
            ease: 'easeInOut',
          },
        },
      },
      path4: {
        initial: { opacity: 1 },
        animate: {
          opacity: [0, 1, 0, 1],
          transition: {
            duration: 0.8,
            ease: 'easeInOut',
          },
        },
      },
      path5: {},
    };

    for (let i = 1; i <= 2; i++) {
      animation[`path${i}`] = {
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: 0,
          scale: 0,
          transition: {
            opacity: {
              duration: 0.2,
              ease: 'easeInOut',
              repeat: 1,
              repeatType: 'reverse',
              repeatDelay: 0.2,
              delay: 0.2 * (i - 1),
            },
            scale: {
              duration: 0.2,
              ease: 'easeInOut',
              repeat: 1,
              repeatType: 'reverse',
              repeatDelay: 0.2,
              delay: 0.2 * (i - 1),
            },
          },
        },
      };
    }

    return animation;
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
    <Router :size="props.size" :strokeWidth="props.strokeWidth" />
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
        width="20"
        height="8"
        x="2"
        y="14"
        rx="2"
        :variants="variants.rect"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M17.84 7.17a4 4 0 0 0-5.66 0"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M20.66 4.34a8 8 0 0 0-11.31 0"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6.01 18H6"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M10.01 18H10"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M15 10v4"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
