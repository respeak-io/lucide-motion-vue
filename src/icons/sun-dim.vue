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
      circle: {},
    };

    for (let i = 1; i <= 8; i++) {
      animation[`path${i}`] = {
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: [0, 1],
          scale: [0, 1],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
            delay: (i - 1) * 0.15,
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
    :hoverTarget="props.hoverTarget"
    :animation="props.animation"
    :persistOnAnimateEnd="props.persistOnAnimateEnd"
    :initialOnAnimateEnd="props.initialOnAnimateEnd"
  >
    <SunDim :size="props.size" :strokeWidth="props.strokeWidth" />
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
      <motion.circle
        cx="12"
        cy="12"
        r="4"
        :variants="variants.circle"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M12 4h.01"
        :variants="variants.path1"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M17.657 6.343h.01"
        :variants="variants.path2"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M20 12h.01"
        :variants="variants.path3"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M17.657 17.657h.01"
        :variants="variants.path4"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M12 20h.01"
        :variants="variants.path5"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6.343 17.657h.01"
        :variants="variants.path6"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M4 12h.01"
        :variants="variants.path7"
        initial="initial"
        :animate="current"
      />
      <motion.path
        d="M6.343 6.343h.01"
        :variants="variants.path8"
        initial="initial"
        :animate="current"
      />
    </motion.svg>
</template>
