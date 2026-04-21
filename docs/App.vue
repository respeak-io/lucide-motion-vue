<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { iconsMeta, type IconMeta } from '@respeak/lucide-motion-vue'
import TopBar from './components/TopBar.vue'
import ConfettiLayer from './components/ConfettiLayer.vue'
import BrowseView from './views/BrowseView.vue'
import DocsView from './views/DocsView.vue'
import { useTheme } from './composables/use-theme'
import { useIconColor } from './composables/use-icon-color'
import { useRouter, type Route } from './router'

const { theme, cycle } = useTheme()
const { iconColor } = useIconColor()
const { route, push } = useRouter()

const search = ref('')
const topBar = ref<InstanceType<typeof TopBar> | null>(null)
const browseView = ref<InstanceType<typeof BrowseView> | null>(null)
const scrollSentinel = ref<HTMLElement | null>(null)

// Header-compact state driven by an IntersectionObserver on a stable sentinel
// positioned absolutely at the top of .app, so header layout shifts (the very
// thing that causes compact-mode) don't move the trigger line and flap the
// state. Previously we compared `window.scrollY` against a threshold, which
// flickered when the header's height change caused the scroll position to
// re-cross the threshold from the other side.
const scrolled = ref(false)

// Filtering lives here so TopBar's count and BrowseView's grid stay in sync
// without crossing a template-ref boundary.
const filtered = computed<IconMeta[]>(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return iconsMeta
  return iconsMeta.filter(
    m => m.kebab.includes(q) || m.pascal.toLowerCase().includes(q),
  )
})

function navigate(r: Route) {
  push(r)
}

function onGlobalKey(e: KeyboardEvent) {
  // ⌘K / Ctrl+K to focus search (jump back to browse first if we're in docs)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    if (route.value.view !== 'browse') {
      push({ view: 'browse', section: null })
    }
    e.preventDefault()
    topBar.value?.focusSearch()
    return
  }
  // Esc closes the drawer if one's open
  if (e.key === 'Escape' && browseView.value?.hasDrawer()) {
    e.preventDefault()
    browseView.value.closeDrawer()
    return
  }
  // / focuses search when not already typing somewhere
  if (
    e.key === '/' &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLTextAreaElement)
  ) {
    if (route.value.view === 'browse') {
      e.preventDefault()
      topBar.value?.focusSearch()
    }
  }
}

let scrollObs: IntersectionObserver | null = null

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)

  if (scrollSentinel.value) {
    scrollObs = new IntersectionObserver(
      ([entry]) => { scrolled.value = !entry.isIntersecting },
      { threshold: 0 },
    )
    scrollObs.observe(scrollSentinel.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey)
  scrollObs?.disconnect()
})

// Close the drawer when navigating away from browse; reset scroll on view swap.
watch(
  () => route.value.view,
  v => {
    if (v !== 'browse') browseView.value?.closeDrawer()
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  },
)
</script>

<template>
  <div class="app">
    <!--
      Stable scroll sentinel. Absolutely positioned at the top of .app so
      its document coords don't change when the sticky header shrinks. The
      observer flips `scrolled` when the sentinel's bottom crosses viewport
      top — a single natural event per scroll direction, no hysteresis needed.
    -->
    <span ref="scrollSentinel" class="scroll-sentinel" aria-hidden="true" />

    <TopBar
      ref="topBar"
      :search="search"
      :show-search="route.view === 'browse'"
      :filtered-count="filtered.length"
      :theme="theme"
      :icon-color="iconColor"
      :route="route"
      :scrolled="scrolled"
      @update:search="search = $event"
      @update:icon-color="iconColor = $event"
      @cycle-theme="cycle"
      @navigate="navigate"
    />

    <BrowseView
      v-show="route.view === 'browse'"
      ref="browseView"
      :filtered="filtered"
      :search="search"
    />

    <DocsView
      v-if="route.view === 'docs'"
      :route="route"
      @navigate="navigate"
    />

    <ConfettiLayer />
  </div>
</template>
