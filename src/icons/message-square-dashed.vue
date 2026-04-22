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
      },
      animate: {
        transformOrigin: 'bottom left',
        rotate: [0, 8, -8, 2, 0],
        transition: {
          ease: 'easeInOut',
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
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
    path9: {},
  } satisfies Record<string, Variants>,
  draw: {
    group: {},
    ...(() => {
      const paths: Record<string, Variants> = {};

      for (let i = 1; i <= 9; i++) {
        paths[`path${i}`] = {
          initial: { opacity: 0, scale: 0 },
          animate: {
            opacity: [0, 1],
            scale: [0, 1],
            transition: {
              delay: i * 0.2,
              duration: 0.4,
            },
          },
        };
      }

      return paths;
    })(),
  },
  'lucide-animated': {
    group: {},
    path1: {
  initial: { opacity: 1 },
  animate: (i: number) => ({
    opacity: [0, 1],
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
    },
    path2: {},
    path3: {},
    path4: {},
    path5: {},
    path6: {},
    path7: {},
    path8: {},
    path9: {},
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
    <MessageSquareDashed :size="props.size" :strokeWidth="props.strokeWidth" />
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
          d="M5 3a2 2 0 0 0-2 2"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M9 3h1"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M14 3h1"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M19 3a2 2 0 0 1 2 2"
          :variants="variants.path4"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M21 9v1"
          :variants="variants.path5"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M21 14v1a2 2 0 0 1-2 2"
          :variants="variants.path6"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M14 17h1"
          :variants="variants.path7"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M10 17H7l-4 4v-7"
          :variants="variants.path8"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M3 9v1"
          :variants="variants.path9"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
