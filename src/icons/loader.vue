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

const SEGMENT_COUNT = 8;
const DURATION = 1.2;
const BASE_OPACITY = 0.25;

const animations = {
  default: (() => {
    const spinner: Record<string, Variants> = {
      group: { initial: {}, animate: {} },
    };

    for (let i = 1; i <= SEGMENT_COUNT; i++) {
      const reverseIndex = SEGMENT_COUNT - i;
      const delay = -(reverseIndex * DURATION) / SEGMENT_COUNT;

      spinner[`path${i}`] = {
        initial: { opacity: 1 },
        animate: {
          opacity: [1, BASE_OPACITY],
          transition: {
            duration: DURATION,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
            delay,
          },
        },
      };
    }

    return spinner as Record<string, Variants>;
  })() satisfies Record<string, Variants>,
  spin: {
    group: {
      initial: { rotate: 0 },
      animate: {
        rotate: 360,
        transition: {
          duration: 1.5,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        },
      },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {},
    path5: {},
    path6: {},
    path7: {},
    path8: {},
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
    <Loader :size="props.size" :strokeWidth="props.strokeWidth" />
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
      :variants="variants.group"
      initial="initial"
      :animate="current"
      @animationComplete="notifyComplete"
    >
      <motion.path
        d="M12 2v4"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m16.2 7.8 2.9-2.9"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M18 12h4"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m16.2 16.2 2.9 2.9"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M12 18v4"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m4.9 19.1 2.9-2.9"
        :variants="variants.path6"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M2 12h4"
        :variants="variants.path7"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="m4.9 4.9 2.9 2.9"
        :variants="variants.path8"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
