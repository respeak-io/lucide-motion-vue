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

const spring = { type: 'spring', damping: 20, stiffness: 200 } as const;

const animations = {
  // Little "clink" at the joint
  default: {
    left: {
      initial: { rotate: 0, transformOrigin: '9px 12px' },
      animate: {
        rotate: [0, 10, 0],
        transformOrigin: '9px 12px',
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    right: {
      initial: { rotate: 0, transformOrigin: '15px 12px' },
      animate: {
        rotate: [0, -6, 0],
        transformOrigin: '15px 12px',
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    middle: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, 12, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    burstTop: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstLeft: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstBottom: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstRight: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
  } satisfies Record<string, Variants>,

  // Pull apart: arcs move outward, line shrinks away
  unlink: {
    left: {
      initial: { x: 0 },
      animate: { x: -1, transition: spring },
    },
    right: {
      initial: { x: 0 },
      animate: { x: 1, transition: spring },
    },
    middle: {
      initial: { opacity: 1, scale: 1 },
      animate: {
        opacity: 0,
        scale: 0,
        transition: { ...spring, delay: 0.1 },
      },
    },
    burstTop: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstLeft: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstBottom: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstRight: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        transition: { duration: 0.4, ease: 'easeInOut', delay: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,

  // Pull apart: arcs move outward, line shrinks away
  'unlink-loop': {
    left: {
      initial: { x: 0 },
      animate: {
        x: [-1, 0, -1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    right: {
      initial: { x: 0 },
      animate: {
        x: [1, 0, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    middle: {
      initial: { opacity: 1, scale: 1 },
      animate: {
        opacity: [1, 0, 1],
        scale: [1, 0, 1],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.1 },
      },
    },
    burstTop: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstLeft: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstBottom: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.2 },
      },
    },
    burstRight: {
      initial: { opacity: 0, scale: 0 },
      animate: {
        opacity: [0, 1, 0, 0],
        scale: [0, 1, 0, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,

  // Emphasize link: arcs nudge toward center, line pulses slightly
  link: {
    left: {
      initial: { x: 0 },
      animate: {
        x: [0, 1.5, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    right: {
      initial: { x: 0 },
      animate: {
        x: [0, -1.5, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    burstTop: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstLeft: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstBottom: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
    },
    burstRight: {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
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
  >
    <Link2 :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <!-- Left arc -->
      <motion.path
        d="M9 17H7A5 5 0 0 1 7 7h2"
        :variants="variants.left"
        initial="initial"
        :animate="current"
      @animationComplete="notifyComplete"
      />
      <!-- Right arc -->
      <motion.path
        d="M15 7h2a5 5 0 1 1 0 10h-2"
        :variants="variants.right"
        initial="initial"
        :animate="current"
      />
      <!-- Middle line -->
      <motion.line
        :x1="8"
        :y1="12"
        :x2="16"
        :y2="12"
        :style="{ transformOrigin: '12px 12px', transformBox: 'view-box' }"
        :variants="variants.middle"
        initial="initial"
        :animate="current"
      />
      <!-- Explosion lines (shown in unlink) - rotated around center to avoid overlap -->
      <motion.g :style="{ rotate: 45, transformOrigin: '12px 12px', transformBox: 'view-box' }">
        <motion.line
          :x1="8"
          :y1="2"
          :x2="8"
          :y2="5"
          :style="{ transformOrigin: '8px 3.5px', transformBox: 'view-box' }"
          :variants="variants.burstTop"
          initial="initial"
          :animate="current"
        />
        <motion.line
          :x1="2"
          :y1="8"
          :x2="5"
          :y2="8"
          :style="{ transformOrigin: '3.5px 8px', transformBox: 'view-box' }"
          :variants="variants.burstLeft"
          initial="initial"
          :animate="current"
        />
        <motion.line
          :x1="16"
          :y1="19"
          :x2="16"
          :y2="22"
          :style="{ transformOrigin: '16px 20.5px', transformBox: 'view-box' }"
          :variants="variants.burstBottom"
          initial="initial"
          :animate="current"
        />
        <motion.line
          :x1="19"
          :y1="16"
          :x2="22"
          :y2="16"
          :style="{ transformOrigin: '20.5px 16px', transformBox: 'view-box' }"
          :variants="variants.burstRight"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
