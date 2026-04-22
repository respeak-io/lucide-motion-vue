<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as lib from '@respeak/lucide-motion-vue'
import {
  iconsMeta,
  type IconAnimation,
  type IconMeta,
} from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'
import PlaygroundPicker from '../components/PlaygroundPicker.vue'
import PlaygroundControls, {
  type TriggerProp,
} from '../components/PlaygroundControls.vue'
import type { Route } from '../router'

const props = defineProps<{ route: Route }>()
const emit = defineEmits<{ (e: 'navigate', r: Route): void }>()

// ---- Initial icon: honor the URL slug, fall back to Heart → first. ----
function findByKebab(kebab: string | null): IconMeta | null {
  if (!kebab) return null
  return iconsMeta.find(m => m.kebab === kebab) ?? null
}

const defaultIcon =
  findByKebab(props.route.section) ??
  iconsMeta.find(m => m.pascal === 'Heart') ??
  iconsMeta[0]

const selected = ref<IconMeta>(defaultIcon)
const variant = ref<IconAnimation>(defaultIcon.animations[0])
const trigger = ref<TriggerProp>('animateOnHover')
const size = ref(96)
const strokeWidth = ref(2)
const color = ref<string | null>(null)
const persist = ref(false)
const clip = ref(false)
const replayKey = ref(0)

// Re-key the icon whenever something that should visibly reset changes,
// so you actually see the animation replay instead of it just silently
// updating its variants mid-flight.
const renderKey = computed(
  () =>
    `${selected.value.kebab}-${variant.value.name}-${trigger.value}-${replayKey.value}`,
)

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}

function handleSelect(m: IconMeta) {
  selected.value = m
  // Reset variant only — preserve size / stroke / color / trigger so the
  // user keeps iterating on the *knobs* across different icons.
  variant.value = m.animations[0]
  replayKey.value++

  // Sync URL so a playground state can be shared.
  emit('navigate', { view: 'playground', section: m.kebab })
}

// External nav → select the icon named in the URL.
watch(
  () => props.route.section,
  slug => {
    if (props.route.view !== 'playground') return
    const m = findByKebab(slug)
    if (m && m.kebab !== selected.value.kebab) {
      selected.value = m
      variant.value = m.animations[0]
      replayKey.value++
    }
  },
)

// Make sure the scoped variant object always points at a real animation on
// the selected icon — swapping icons with only a 'default' variant used to
// leave stale refs around in edge cases.
watch(selected, m => {
  if (!m.animations.some(a => a.name === variant.value.name)) {
    variant.value = m.animations[0]
  }
})

function replay() {
  replayKey.value++
}

// ---- Code snippet generation ----
//
// Emit the shortest Vue template that reproduces exactly what's rendered,
// including the import line. Conditionally include props so the copy stays
// clean when the user hasn't touched a knob.
const snippet = computed(() => {
  const lines: string[] = [`<${selected.value.pascal}`]

  // Trigger: programmatic is the only one that uses a :bound value; the rest
  // are bare boolean attributes (or the string shorthand, but we prefer the
  // separate `animation` prop for readability).
  if (trigger.value === 'animate') {
    lines.push(`  :animate="true"`)
  } else {
    lines.push(`  ${trigger.value}`)
  }

  if (variant.value.name !== 'default') {
    lines.push(`  animation="${variant.value.name}"`)
  }

  if (size.value !== 28) {
    lines.push(`  :size="${size.value}"`)
  }
  if (strokeWidth.value !== 2) {
    lines.push(`  :strokeWidth="${strokeWidth.value}"`)
  }
  if (color.value) {
    lines.push(`  style="color: ${color.value}"`)
  }
  if (persist.value) {
    lines.push(`  persistOnAnimateEnd`)
  }
  if (clip.value) {
    lines.push(`  clip`)
  }
  lines.push(`/>`)
  return lines.join('\n')
})

const importLine = computed(
  () => `import { ${selected.value.pascal} } from '@respeak/lucide-motion-vue'`,
)

// ---- Expose focus helper so the global ⌘K / '/' bindings can target it. ----
const pickerRef = ref<InstanceType<typeof PlaygroundPicker> | null>(null)
defineExpose({
  focusSearch() {
    pickerRef.value?.focus()
  },
})

</script>

<template>
  <div class="pg">
    <aside class="pg-side" aria-label="Icon picker">
      <PlaygroundPicker
        ref="pickerRef"
        :selected="selected"
        @select="handleSelect"
      />
    </aside>

    <main class="pg-main">
      <div class="pg-head">
        <div class="pg-title">
          <h2>{{ selected.pascal }}</h2>
          <span class="pg-kebab">{{ selected.kebab }}</span>
        </div>
        <span class="pg-variants-count">
          {{ selected.animations.length }} variant{{ selected.animations.length === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="pg-stage">
        <div
          class="pg-stage-inner"
          :style="color ? { color } : undefined"
        >
          <component
            :is="resolveIcon(selected.pascal)"
            :key="renderKey"
            :animateOnHover="trigger === 'animateOnHover'"
            :animateOnTap="trigger === 'animateOnTap'"
            :animateOnView="trigger === 'animateOnView'"
            :animate="trigger === 'animate'"
            :animation="variant.name"
            :size="size"
            :strokeWidth="strokeWidth"
            :persistOnAnimateEnd="persist"
            :clip="clip"
          />
        </div>
        <span class="pg-stage-hint">
          <template v-if="trigger === 'animateOnHover'">hover the icon</template>
          <template v-else-if="trigger === 'animateOnTap'">click the icon</template>
          <template v-else-if="trigger === 'animateOnView'">replays on scroll into view</template>
          <template v-else>use replay →</template>
        </span>
      </div>

      <CodeBlock :code="snippet" lang="vue" />
      <CodeBlock :code="importLine" lang="ts" />
    </main>

    <aside class="pg-knobs" aria-label="Props">
      <PlaygroundControls
        :meta="selected"
        :variant="variant"
        :trigger="trigger"
        :size="size"
        :stroke-width="strokeWidth"
        :color="color"
        :persist="persist"
        :clip="clip"
        @update:variant="variant = $event"
        @update:trigger="trigger = $event"
        @update:size="size = $event"
        @update:stroke-width="strokeWidth = $event"
        @update:color="color = $event"
        @update:persist="persist = $event"
        @update:clip="clip = $event"
        @replay="replay"
      />
    </aside>
  </div>
</template>
