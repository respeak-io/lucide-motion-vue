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
        rotate: [0, 90, 180],
        transition: {
          duration: 1.25,
          ease: 'easeInOut',
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
    path10: {},
    path11: {},
    path12: {},
    path13: {},
    path14: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 90, 180, 270, 360],
        transition: {
          duration: 2.5,
          ease: 'easeInOut',
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
    path10: {},
    path11: {},
    path12: {},
    path13: {},
    path14: {},
  } satisfies Record<string, Variants>,
  rotate: {
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: 360,
        transition: {
          duration: 2,
          ease: 'linear',
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
    path10: {},
    path11: {},
    path12: {},
    path13: {},
    path14: {},
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
    <Cog :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.g :variants="variants.group" initial="initial" :animate="current"
      @animationComplete="notifyComplete">
        <motion.path
          d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
          :variants="variants.path1"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
          :variants="variants.path2"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M12 2v2"
          :variants="variants.path3"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M12 22v-2"
          :variants="variants.path4"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m17 20.66-1-1.73"
          :variants="variants.path5"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M11 10.27 7 3.34"
          :variants="variants.path6"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m20.66 17-1.73-1"
          :variants="variants.path7"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m3.34 7 1.73 1"
          :variants="variants.path8"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M14 12h8"
          :variants="variants.path9"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="M2 12h2"
          :variants="variants.path10"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m20.66 7-1.73 1"
          :variants="variants.path11"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m3.34 17 1.73-1"
          :variants="variants.path12"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m17 3.34-1 1.73"
          :variants="variants.path13"
          initial="initial"
          :animate="current"
        />
        <motion.path
          d="m11 13.73-4 6.93"
          :variants="variants.path14"
          initial="initial"
          :animate="current"
        />
      </motion.g>
    </motion.svg>
</template>
