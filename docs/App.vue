<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { iconsMeta, type IconMeta } from '@respeak/lucide-motion-vue'
import TopBar from './components/TopBar.vue'
import ConfettiLayer from './components/ConfettiLayer.vue'
import BrowseView from './views/BrowseView.vue'
import DocsView from './views/DocsView.vue'
import PlaygroundView from './views/PlaygroundView.vue'
import { useTheme } from './composables/use-theme'
import { useIconColor } from './composables/use-icon-color'
import { useRouter, type Route } from './router'

const { theme, cycle } = useTheme()
const { iconColor } = useIconColor()
const { route, push } = useRouter()

const search = ref('')
const topBar = ref<InstanceType<typeof TopBar> | null>(null)
const playgroundView = ref<InstanceType<typeof PlaygroundView> | null>(null)
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

// The open detail drawer is a route (`#/icon/<kebab>`), not local component
// state — so the browser Back button (and the mobile back gesture) closes it
// instead of leaving the site, and an icon's detail is deep-linkable.
const selectedIcon = computed<IconMeta | null>(() => {
  if (route.value.view !== 'browse' || !route.value.section) return null
  return iconsMeta.find(m => m.kebab === route.value.section) ?? null
})

// Was the drawer opened by navigating within the app (vs. a cold deep-link or
// a Forward back into it)? When it was, closing pops the history entry we
// pushed, so Back and the close button behave identically with no leftover
// forward entry that would re-open the drawer. Otherwise we replace the URL so
// closing never steps off the site.
const openedFromApp = ref(false)

function openIcon(m: IconMeta) {
  openedFromApp.value = true
  push({ view: 'browse', section: m.kebab })
}

function closeIcon() {
  if (openedFromApp.value) history.back()
  else push({ view: 'browse', section: null })
}

// Reset the flag whenever the drawer actually closes, however that happened
// (Back, close button, Esc, or navigating to another view).
watch(selectedIcon, icon => {
  if (!icon) openedFromApp.value = false
})

function navigate(r: Route) {
  push(r)
}

function onGlobalKey(e: KeyboardEvent) {
  // ⌘K / Ctrl+K to focus search. In playground we focus the picker's own
  // search; in docs we route back to browse first; in browse we target the
  // top-bar search.
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    if (route.value.view === 'playground') {
      e.preventDefault()
      playgroundView.value?.focusSearch()
      return
    }
    if (route.value.view !== 'browse') {
      push({ view: 'browse', section: null })
    }
    e.preventDefault()
    topBar.value?.focusSearch()
    return
  }
  // Esc closes the drawer if one's open
  if (e.key === 'Escape' && selectedIcon.value) {
    e.preventDefault()
    closeIcon()
    return
  }
  // / focuses the contextual search when not already typing somewhere
  if (
    e.key === '/' &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLTextAreaElement)
  ) {
    if (route.value.view === 'browse') {
      e.preventDefault()
      topBar.value?.focusSearch()
    } else if (route.value.view === 'playground') {
      e.preventDefault()
      playgroundView.value?.focusSearch()
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

// Reset scroll on view swap. The drawer closes on its own when the route
// leaves the icon path, since it's derived from the route now.
watch(
  () => route.value.view,
  () => {
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
      :scrolled="scrolled || route.view === 'playground'"
      @update:search="search = $event"
      @update:icon-color="iconColor = $event"
      @cycle-theme="cycle"
      @navigate="navigate"
    />

    <BrowseView
      v-show="route.view === 'browse'"
      :filtered="filtered"
      :search="search"
      :selected="selectedIcon"
      @open="openIcon"
      @close="closeIcon"
    />

    <PlaygroundView
      v-if="route.view === 'playground'"
      ref="playgroundView"
      :route="route"
      @navigate="navigate"
    />

    <DocsView
      v-if="route.view === 'docs'"
      :route="route"
      @navigate="navigate"
    />

    <ConfettiLayer />
  </div>
</template>
