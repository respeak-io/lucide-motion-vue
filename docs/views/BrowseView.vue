<script setup lang="ts">
import { type IconMeta } from '@respeak/lucide-motion-vue'
import IconCard from '../components/IconCard.vue'
import IconDrawer from '../components/IconDrawer.vue'

// The open drawer is owned by the route (App.vue derives `selected` from
// `#/icon/<kebab>`), so opening/closing goes back up as events. This is what
// puts the drawer in browser history — Back closes it instead of leaving.
defineProps<{ filtered: IconMeta[]; search: string; selected: IconMeta | null }>()
defineEmits<{ (e: 'open', meta: IconMeta): void; (e: 'close'): void }>()
</script>

<template>
  <!-- Single root so `v-show` on the parent component has somewhere to attach. -->
  <div class="browse-root">
    <main>
      <div v-if="filtered.length === 0" class="empty">
        No icons match <strong>"{{ search }}"</strong>. Try a shorter query.
      </div>

      <div v-else class="grid">
        <IconCard
          v-for="m in filtered"
          :key="m.kebab"
          :meta="m"
          @open="$emit('open', m)"
        />
      </div>
    </main>

    <footer class="foot">
      <span>
        SVG from <a href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a>
        · variants adapted from
        <a href="https://github.com/imskyleen/animate-ui" target="_blank" rel="noreferrer">animate-ui</a>
        · animation via
        <a href="https://motion.dev/docs/vue" target="_blank" rel="noreferrer">Motion for Vue</a>.
      </span>
    </footer>

    <IconDrawer v-if="selected" :meta="selected" @close="$emit('close')" />
  </div>
</template>

<style scoped>
.browse-root {
  display: contents;
}
</style>
