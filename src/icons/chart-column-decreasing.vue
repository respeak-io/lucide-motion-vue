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
      path4: {},
    };

    for (let i = 1; i <= 3; i++) {
      animation[`path${i}`] = {
        initial: { opacity: 1 },
        animate: {
          opacity: [0, 1],
          pathLength: [0, 1],
          transition: {
            ease: 'easeInOut',
            duration: 0.4,
            delay: (i - 1) * 0.3,
          },
        },
      };
    }

    return animation as Record<string, Variants>;
  })() satisfies Record<string, Variants>,
  'default-loop': (() => {
    const n = 3;
    const delayStep = 0.3;
    const segDuration = 0.4;

    const startOut = (i: number) => (n - i) * delayStep;
    const endOut = (i: number) => startOut(i) + segDuration;

    const outTotal = Math.max(
      ...Array.from({ length: n }, (_, k) => endOut(k + 1)),
    );

    const startIn = (i: number) => outTotal + (i - 1) * delayStep;
    const endIn = (i: number) => startIn(i) + segDuration;

    const totalDuration = Math.max(
      ...Array.from({ length: n }, (_, k) => endIn(k + 1)),
    );

    const animation: Record<string, Variants> = {};

    for (let i = 1; i <= n; i++) {
      const tSO = startOut(i) / totalDuration;
      const tEO = endOut(i) / totalDuration;
      const tSI = startIn(i) / totalDuration;
      const tEI = endIn(i) / totalDuration;

      animation[`path${i}`] = {
        initial: { opacity: 1, pathLength: 1 },
        animate: {
          pathLength: [1, 1, 0, 0, 1],
          opacity: [1, 1, 0, 0, 1],
          transition: {
            ease: 'easeInOut',
            duration: totalDuration,
            times: [0, tSO, tEO, tSI, tEI],
          },
        },
      };
    }

    return animation as Record<string, Variants>;
  })() satisfies Record<string, Variants>,
  increasing: {
    path1: {
      initial: { d: 'M8 17V5' },
      animate: {
        d: 'M8 17V13',
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
    path2: {},
    path3: {
      initial: { d: 'M18 17V13' },
      animate: {
        d: 'M18 17V5',
        transition: { duration: 0.5, ease: 'easeInOut' },
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
  >
    <ChartColumnDecreasing :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.path
        d="M8 17V5"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <motion.path
        d="M13 17V9"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M18 17V13"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M3 3v16a2 2 0 0 0 2 2h16"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
