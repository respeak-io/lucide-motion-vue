<script setup lang="ts">
// Auto-generated from pqoqubbw/icons by scripts/port-pqoqubbw-icons.mjs.
// Upstream source: bot-message-square
// Variants and SVG geometry adapted from https://github.com/pqoqubbw/icons (MIT).
// Surfaced in the docs as "lucide-animated" (https://lucide-animated.com).
// Adaptation: `normal` → `initial`; React forwardRef/useAnimation/mouse
// handlers replaced by our AnimateIcon context.
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
    path: {
          initial: { rotate: 0, y: 0, scale: 1 },
          animate: {
            rotate: [0, -3, 3, 0, 0],
            y: [0, 1.5, -1.5, 0],
            scale: [1, 1.03, 1],
            transition: {
              duration: 1,
              ease: "easeInOut",
              repeat: 0,
            },
          },
        },
    path2: {
            initial: { scale: 1, originX: 0.5, originY: 0.5 },
            animate: {
              scale: [1, 1.04, 1],
              transition: {
                duration: 0.6,
                ease: "easeInOut",
                repeat: 1,
              },
            },
          },
    path3: {
            initial: { scaleY: 1, originY: 0.5 },
            animate: {
              scaleY: [1, 0.1, 1],
              transition: { duration: 0.4, ease: "easeInOut", delay: 0.1 },
            },
          },
    path4: {
            initial: { scaleY: 1, originY: 0.5 },
            animate: {
              scaleY: [1, 0.1, 1],
              transition: { duration: 0.4, ease: "easeInOut", delay: 0.2 },
            },
          },
    path5: {
            initial: { opacity: 0 },
            animate: {
              opacity: [0.3, 1, 0.3],
              transition: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.2,
                delay: 0,
              },
            },
          },
    path6: {
            initial: { opacity: 0 },
            animate: {
              opacity: [0.3, 1, 0.3],
              transition: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.2,
                delay: 0.3,
              },
            },
          },
    path7: {
            initial: { opacity: 0 },
            animate: {
              opacity: [0.3, 1, 0.3],
              transition: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.2,
                delay: 0.6,
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
    :triggerTarget="props.triggerTarget"
  >
    <BotMessageSquare2 :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <motion.svg
    v-else
    overflow="visible"
        :animate="current"
      @animationComplete="notifyComplete"
        fill="none"
        :height="props.size"
        initial="initial"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="props.strokeWidth"
        :variants="variants.path"
        viewBox="0 0 24 24"
        :width="props.size"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 6V2H8" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <motion.path
          d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"
          :variants="variants.path2"
        />
        <motion.path
          d="M9 11v2"
          :variants="variants.path3"
        />
        <motion.path
          d="M15 11v2"
          :variants="variants.path4"
        />
        <motion.circle
          cx="10"
          cy="18"
          r="0.5"
          :variants="variants.path5"
        />
        <motion.circle
          cx="12"
          cy="18"
          r="0.5"
          :variants="variants.path6"
        />
        <motion.circle
          cx="14"
          cy="18"
          r="0.5"
          :variants="variants.path7"
        />
      </motion.svg>
</template>
