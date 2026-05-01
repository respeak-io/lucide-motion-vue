<script setup lang="ts">
/**
 * Renders a data-driven icon whose element graph and variant transitions
 * change with the active animation. Used by forge-generated multi-variant
 * SFCs whose proposals split source paths differently per animation —
 * something the standard hand-templated layout can't express, since it
 * fixes one element list and only varies the `variants` block.
 *
 * Consumers don't import this directly. The generated icon SFC delegates
 * to it; users still call the icon with `<Bell animation="alt" />` and
 * never see this component.
 *
 * Element-tree shape: each variant ships a flat list of top-level
 * `SvgElement` entries; wrapper tags (`g`) may carry `children` for
 * recursive rendering. `<MultiVariantElement>` walks the tree.
 */
import { computed } from 'vue'
import { motion } from 'motion-v'
import MultiVariantElement from './MultiVariantElement.vue'
import { useAnimateIconContext, type IconTriggerProps } from './context'
import type { MultiVariantAnimations } from './element-types'

const props = withDefaults(
  defineProps<
    IconTriggerProps & {
      animations: MultiVariantAnimations
      strokeWidth?: number
    }
  >(),
  { size: 28, strokeWidth: 2 },
)

// Touch the context here so consumer triggers (e.g. `animateOnHover`) still
// resolve at the icon-component layer; the tree-walker below reads `current`
// itself for each animated child.
useAnimateIconContext()
const { animation } = useAnimateIconContext()

const active = computed(() => {
  const requested = animation.value
  return (
    props.animations[requested] ??
    props.animations.default ??
    Object.values(props.animations)[0]
  )
})
</script>

<template>
  <motion.svg
    overflow="visible"
    style="user-select: none; -webkit-user-select: none; outline: none"
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
    <MultiVariantElement
      v-for="(el, i) in active.elements"
      :key="`${i}-${el.tag}`"
      :el="el"
      :variants="active.variants"
    />
  </motion.svg>
</template>
