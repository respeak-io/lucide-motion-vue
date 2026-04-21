<script setup lang="ts">
import { ref } from 'vue'
import { AnimateIcon, Moon, Sun, SunMoon, iconsMeta } from '@respeak/lucide-motion-vue'
import ColorPicker from './ColorPicker.vue'
import type { Route } from '../router'
import type { Theme } from '../composables/use-theme'

defineProps<{
  // Search (only shown on browse view)
  search?: string
  showSearch?: boolean
  filteredCount?: number
  // Theme
  theme: Theme
  // Icon color
  iconColor: string | null
  // Route
  route: Route
  // Compact header state — computed in App.vue from an IntersectionObserver
  // on a stable sentinel so layout shifts here can't feed back into it.
  scrolled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:search', v: string): void
  (e: 'update:iconColor', v: string | null): void
  (e: 'cycle-theme'): void
  (e: 'navigate', r: Route): void
}>()

const searchEl = ref<HTMLInputElement | null>(null)

defineExpose({
  focusSearch() {
    searchEl.value?.focus()
    searchEl.value?.select()
  },
})

function go(view: Route['view']) {
  emit('navigate', { view, section: null })
}
</script>

<template>
  <header class="top" :class="{ 'is-scrolled': scrolled }">
    <div class="brand">
      <h1>
        <a href="#/" @click.prevent="go('browse')" class="brand-link">
          <span class="at">@</span><span class="scope">respeak</span
          ><span class="at">/</span>lucide-motion-vue
        </a>
      </h1>
      <p class="tagline">
        {{ iconsMeta.length }} Lucide icons animated with Motion for Vue.
        Hover any card to preview; click for variants and copy-paste snippets.
      </p>
    </div>

    <div class="nav-row">
      <nav class="view-tabs" role="tablist" aria-label="Sections">
        <button
          class="view-tab"
          role="tab"
          :aria-selected="route.view === 'browse'"
          :class="{ active: route.view === 'browse' }"
          @click="go('browse')"
        >
          Browse icons
        </button>
        <button
          class="view-tab"
          role="tab"
          :aria-selected="route.view === 'docs'"
          :class="{ active: route.view === 'docs' }"
          @click="go('docs')"
        >
          Read the docs
        </button>
      </nav>

      <div class="actions">
        <!--
          Use the library's own animated icons here so the toggle doubles
          as a live demo. Wrapped in AnimateIcon (as="template") so the
          whole button becomes the hover/tap trigger.
        -->
        <AnimateIcon animateOnHover animateOnTap as="template" v-slot="{ on }">
          <button
            class="icon-btn"
            :title="`Theme: ${theme} (click to cycle)`"
            :aria-label="`Theme: ${theme}. Click to cycle.`"
            v-on="on"
            @click="emit('cycle-theme')"
          >
            <Sun     v-if="theme === 'light'"  :key="'theme-sun'"      :size="18" />
            <Moon    v-else-if="theme === 'dark'" :key="'theme-moon'"  :size="18" />
            <SunMoon v-else                    :key="'theme-sunmoon'"  :size="18" />
          </button>
        </AnimateIcon>

        <ColorPicker
          :model-value="iconColor"
          @update:model-value="emit('update:iconColor', $event)"
        />

        <a
          class="icon-btn"
          href="https://github.com/respeak-io/lucide-motion-vue"
          target="_blank"
          rel="noreferrer"
          title="GitHub"
          aria-label="GitHub repository"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/>
          </svg>
        </a>
      </div>
    </div>

    <div v-if="showSearch" class="toolbar">
      <div class="search">
        <span class="icon-leading" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
        </span>
        <input
          ref="searchEl"
          :value="search"
          type="search"
          :placeholder="`Search ${iconsMeta.length} icons…`"
          autocomplete="off"
          autofocus
          spellcheck="false"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
        <span class="kbd-hint"><kbd>⌘</kbd>&nbsp;<kbd>K</kbd></span>
      </div>
      <span class="count">
        {{ filteredCount }} / {{ iconsMeta.length }}
      </span>
    </div>
  </header>
</template>
