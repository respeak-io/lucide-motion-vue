<script setup lang="ts">
import * as lib from '@respeak/lucide-motion-vue'
import { AnimateIcon, type IconMeta } from '@respeak/lucide-motion-vue'

defineProps<{ meta: IconMeta }>()
defineEmits<{ (e: 'open', m: IconMeta): void }>()

function resolveIcon(pascal: string) {
  return (lib as unknown as Record<string, unknown>)[pascal] as any
}
</script>

<template>
  <!--
    Card-as-trigger: AnimateIcon in template mode exposes `{ on }` so
    the entire card — icon, name, badge, padding — becomes the hover
    zone. No `loop` here: one-shot icons play once per hover, and icons
    whose upstream variants already bake in `repeat: Infinity` keep
    looping under their own power.
  -->
  <AnimateIcon animateOnHover as="template" v-slot="{ on }">
    <button class="card" v-on="on" @click="$emit('open', meta)">
      <span v-if="meta.animations.length > 1" class="badge">
        {{ meta.animations.length }}
      </span>
      <span class="icon">
        <component :is="resolveIcon(meta.pascal)" :size="38" />
      </span>
      <span class="name">{{ meta.kebab }}</span>
    </button>
  </AnimateIcon>
</template>
