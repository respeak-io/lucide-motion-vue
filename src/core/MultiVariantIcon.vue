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
 * Variant-switch behavior: when the user changes the `animation` prop and
 * the element graphs differ, Vue diffs the `<template v-for>` and
 * mounts/unmounts elements as the keys change. Elements that exist at the
 * same index in both variants and share the same `tag`+`attrs.d` will
 * be reused (no flicker). Elements unique to the new variant flash in.
 */
import { computed } from 'vue'
import { motion, type Variants } from 'motion-v'
import MorphPath from './MorphPath.vue'
import { useAnimateIconContext, type IconTriggerProps } from './context'
import type { MultiVariantAnimations, SvgElement } from './element-types'

const props = withDefaults(
  defineProps<
    IconTriggerProps & {
      animations: MultiVariantAnimations
      strokeWidth?: number
    }
  >(),
  { size: 28, strokeWidth: 2 },
)

const { current, animation, notifyComplete } = useAnimateIconContext()

const active = computed(() => {
  const requested = animation.value
  return (
    props.animations[requested] ??
    props.animations.default ??
    Object.values(props.animations)[0]
  )
})

function elementBindings(el: SvgElement): Record<string, string | number> {
  return el.attrs ?? {}
}

function variantsFor(el: SvgElement): Variants | undefined {
  if (!el.key) return undefined
  return active.value.variants[el.key]
}
</script>

<template>
  <motion.svg
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
    <template v-for="(el, i) in active.elements" :key="`${i}-${el.tag}`">
      <MorphPath
        v-if="el.tag === 'path' && el.paths && el.paths.length >= 2"
        :paths="el.paths"
        :variants="variantsFor(el)"
        initial="initial"
        :animate="current"
        @animationComplete="notifyComplete"
      />
      <component
        v-else-if="el.key && variantsFor(el)"
        :is="(motion as Record<string, unknown>)[el.tag]"
        v-bind="elementBindings(el)"
        :variants="variantsFor(el)"
        initial="initial"
        :animate="current"
        @animationComplete="notifyComplete"
      />
      <component
        v-else
        :is="el.tag"
        v-bind="elementBindings(el)"
      />
    </template>
  </motion.svg>
</template>
