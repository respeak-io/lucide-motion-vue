<script setup lang="ts">
import { ref } from 'vue'
import { type IconMeta } from '@respeak/lucide-motion-vue'
import IconCard from '../components/IconCard.vue'
import IconDrawer from '../components/IconDrawer.vue'

defineProps<{ filtered: IconMeta[]; search: string }>()

const selected = ref<IconMeta | null>(null)

defineExpose({
  closeDrawer() { selected.value = null },
  hasDrawer() { return selected.value !== null },
})

function open(m: IconMeta) { selected.value = m }
function close() { selected.value = null }
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
          @open="open"
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

    <IconDrawer v-if="selected" :meta="selected" @close="close" />
  </div>
</template>

<style scoped>
.browse-root {
  display: contents;
}
</style>
