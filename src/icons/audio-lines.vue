<script setup lang="ts">
// Multi-variant icon. `default` is the animate-ui silhouette (six animated
// vertical lines); `alt` is the pqoqubbw/lucide-animated silhouette (four
// animated paths flanked by two static caps). Element graphs differ — keys
// and counts both diverge — so we delegate to `<MultiVariantIcon>` rather
// than the standard hand-templated layout.
import { computed } from 'vue'
import type { Variants } from 'motion-v'
import AnimateIcon from '../core/AnimateIcon.vue'
import MultiVariantIcon from '../core/MultiVariantIcon.vue'
import {
  hasOwnTriggers,
  type IconTriggerProps,
} from '../core/context'
import type { MultiVariantAnimations } from '../core/element-types'

const props = withDefaults(
  defineProps<IconTriggerProps & { strokeWidth?: number }>(),
  { size: 28, strokeWidth: 2 },
)

const animations: MultiVariantAnimations = {
  default: {
    elements: [
      { tag: 'line', attrs: { x1: 2, y1: 10, x2: 2, y2: 13 }, key: 'line1' },
      { tag: 'line', attrs: { x1: 6, y1: 6, x2: 6, y2: 17 }, key: 'line2' },
      { tag: 'line', attrs: { x1: 10, y1: 3, x2: 10, y2: 21 }, key: 'line3' },
      { tag: 'line', attrs: { x1: 14, y1: 8, x2: 14, y2: 15 }, key: 'line4' },
      { tag: 'line', attrs: { x1: 18, y1: 5, x2: 18, y2: 18 }, key: 'line5' },
      { tag: 'line', attrs: { x1: 22, y1: 10, x2: 22, y2: 13 }, key: 'line6' },
    ],
    variants: {
      line1: {
        initial: { y1: 10, y2: 13 },
        animate: {
          y1: [10, 5, 8, 6, 10],
          y2: [13, 18, 15, 17, 13],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
      line2: {
        initial: { y1: 6, y2: 17 },
        animate: {
          y1: [6, 2, 10, 6],
          y2: [17, 22, 13, 17],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
      line3: {
        initial: { y1: 3, y2: 21 },
        animate: {
          y1: [3, 6, 3, 8, 3],
          y2: [21, 17, 21, 15, 21],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
      line4: {
        initial: { y1: 8, y2: 15 },
        animate: {
          y1: [8, 4, 7, 2, 8],
          y2: [15, 19, 16, 22, 15],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
      line5: {
        initial: { y1: 5, y2: 18 },
        animate: {
          y1: [5, 10, 4, 8, 5],
          y2: [18, 13, 19, 15, 18],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
      line6: {
        initial: { y1: 10, y2: 13 },
        animate: {
          y1: [10, 8, 5, 10],
          y2: [13, 15, 18, 13],
          transition: { duration: 1.5, ease: 'linear', repeat: Infinity },
        },
      },
    } satisfies Record<string, Variants>,
  },
  alt: {
    elements: [
      { tag: 'path', attrs: { d: 'M2 10v3' } },
      { tag: 'path', attrs: { d: 'M6 6v11' }, key: 'path1' },
      { tag: 'path', attrs: { d: 'M10 3v18' }, key: 'path2' },
      { tag: 'path', attrs: { d: 'M14 8v7' }, key: 'path3' },
      { tag: 'path', attrs: { d: 'M18 5v13' }, key: 'path4' },
      { tag: 'path', attrs: { d: 'M22 10v3' } },
    ],
    variants: {
      path1: {
        initial: { d: 'M6 6v11' },
        animate: {
          d: ['M6 6v11', 'M6 10v3', 'M6 6v11'],
          transition: { duration: 1.5, repeat: Infinity },
        },
      },
      path2: {
        initial: { d: 'M10 3v18' },
        animate: {
          d: ['M10 3v18', 'M10 9v5', 'M10 3v18'],
          transition: { duration: 1, repeat: Infinity },
        },
      },
      path3: {
        initial: { d: 'M14 8v7' },
        animate: {
          d: ['M14 8v7', 'M14 6v11', 'M14 8v7'],
          transition: { duration: 0.8, repeat: Infinity },
        },
      },
      path4: {
        initial: { d: 'M18 5v13' },
        animate: {
          d: ['M18 5v13', 'M18 7v9', 'M18 5v13'],
          transition: { duration: 1.5, repeat: Infinity },
        },
      },
    } satisfies Record<string, Variants>,
  },
}

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
    <AudioLines :size="props.size" :strokeWidth="props.strokeWidth" />
  </AnimateIcon>

  <MultiVariantIcon
    v-else
    :animations="animations"
    :size="props.size"
    :strokeWidth="props.strokeWidth"
  />
</template>
