<script setup lang="ts">
/**
 * Renders one node of a `<MultiVariantIcon>` element tree. Self-recursive:
 * wrapper tags like `<g>` carry `children: SvgElement[]`, and this component
 * mounts itself for each child so the tree renders correctly. The recursion
 * relies on `defineOptions({ name: ... })` so the template can self-reference
 * by name.
 *
 * Three render branches:
 *   - **morph**: `tag === 'path'` with a `paths` chain → `<MorphPath>` for
 *     flubber-driven silhouette interpolation.
 *   - **animated**: keyed element with a matching variant block → motion-v
 *     dynamic component bound to `:variants` + `:animate`. Includes wrapper
 *     groups (`<motion.g>`) where motion-v propagates the variant to keyed
 *     descendants automatically.
 *   - **static**: any element without a key → plain SVG tag, optionally
 *     containing children.
 */
import { motion, type Variants } from 'motion-v'
import MorphPath from './MorphPath.vue'
import { useAnimateIconContext } from './context'
import type { SvgElement } from './element-types'

defineOptions({ name: 'MultiVariantElement' })

const props = defineProps<{
  el: SvgElement
  variants: Record<string, Variants>
}>()

const { current, notifyComplete } = useAnimateIconContext()

function variantsFor(el: SvgElement): Variants | undefined {
  if (!el.key) return undefined
  return props.variants[el.key]
}

function elementBindings(el: SvgElement): Record<string, string | number> {
  return el.attrs ?? {}
}
</script>

<template>
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
  >
    <MultiVariantElement
      v-for="(child, i) in el.children"
      :key="`${i}-${child.tag}`"
      :el="child"
      :variants="variants"
    />
  </component>
  <component
    v-else
    :is="el.tag"
    v-bind="elementBindings(el)"
  >
    <MultiVariantElement
      v-for="(child, i) in el.children"
      :key="`${i}-${child.tag}`"
      :el="child"
      :variants="variants"
    />
  </component>
</template>
