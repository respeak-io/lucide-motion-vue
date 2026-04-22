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
        x: 0,
      },
      animate: {
        x: 7,
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
        },
      },
    },
    group1: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, -26, 0, -26, 0],
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
        },
      },
    },
    group2: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 26, 0, 26, 0],
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
        },
      },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {
      initial: {
        opacity: 1,
        scale: 1,
      },
      animate: {
        opacity: 0,
        scale: 0,
        transition: {
          duration: 0.2,
          ease: 'easeInOut',
          delay: 0.25,
        },
      },
    },
    path5: {
      initial: {
        opacity: 1,
        scale: 1,
      },
      animate: {
        opacity: 0,
        scale: 0,
        transition: {
          duration: 0.2,
          ease: 'easeInOut',
          delay: 0.85,
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
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
    :clip="props.clip"
  >
    <ScissorsLineDashed :size="props.size" :strokeWidth="props.strokeWidth" />
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
        <motion.g
          :variants="variants.group1"
          initial="initial"
          :animate="current"
        >
          <motion.circle
            cx="4"
            cy="8"
            r="2"
            :variants="variants.circle1"
            initial="initial"
            :animate="current"
          />
          <motion.path
            d="M5.42 9.42 8 12"
            :variants="variants.path1"
            initial="initial"
            :animate="current"
          />
          <motion.path
            d="M10.8 14.8 14 18"
            :variants="variants.path2"
            initial="initial"
            :animate="current"
          />
        </motion.g>
        <motion.g
          :variants="variants.group2"
          initial="initial"
          :animate="current"
        >
          <motion.circle
            cx="4"
            cy="16"
            r="2"
            :variants="variants.circle2"
            initial="initial"
            :animate="current"
          />
          <motion.path
            d="m14 6-8.58 8.58"
            :variants="variants.path3"
            initial="initial"
            :animate="current"
          />
        </motion.g>
      </motion.g>
      <motion.path
        d="M16 12h-2"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M22 12h-2"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
