<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sections } from '../sections/sections'
import QuickstartSection from '../sections/QuickstartSection.vue'
import ButtonsSection from '../sections/ButtonsSection.vue'
import VariantsSection from '../sections/VariantsSection.vue'
import ColorSection from '../sections/ColorSection.vue'
import ProgrammaticSection from '../sections/ProgrammaticSection.vue'
import AgentsSection from '../sections/AgentsSection.vue'
import type { Route } from '../router'

const props = defineProps<{ route: Route }>()
const emit = defineEmits<{ (e: 'navigate', r: Route): void }>()

const active = ref(props.route.section ?? 'quickstart')
let observer: IntersectionObserver | null = null
let manualScrollUntil = 0

function go(slug: string) {
  active.value = slug
  manualScrollUntil = Date.now() + 800
  emit('navigate', { view: 'docs', section: slug })
  nextTick(() => {
    const el = document.getElementById(slug)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// External nav → scroll to matching section
watch(
  () => props.route.section,
  s => {
    const target = s ?? 'quickstart'
    if (target === active.value) return
    active.value = target
    nextTick(() => {
      const el = document.getElementById(target)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  },
)

onMounted(() => {
  // Track which section is in view. Uses a root margin biased toward the top
  // so "active" flips as soon as a heading approaches the top of the viewport.
  observer = new IntersectionObserver(
    entries => {
      // During a programmatic scroll triggered by clicking a sidebar item,
      // suspend auto-update so the click's chosen section wins visually.
      if (Date.now() < manualScrollUntil) return
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length === 0) return
      visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      const id = visible[0].target.id
      if (id && id !== active.value) {
        active.value = id
        // Keep the URL in sync without pushing new history entries.
        const hash = `#/docs/${id}`
        if (window.location.hash !== hash) {
          history.replaceState(null, '', hash)
        }
      }
    },
    { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
  )
  for (const s of sections) {
    const el = document.getElementById(s.slug)
    if (el) observer.observe(el)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="docs">
    <aside class="docs-side" aria-label="Docs navigation">
      <p class="docs-side-title">Docs</p>
      <nav>
        <a
          v-for="s in sections"
          :key="s.slug"
          :href="`#/docs/${s.slug}`"
          :class="['docs-link', { active: active === s.slug }]"
          @click.prevent="go(s.slug)"
        >
          <span class="docs-link-title">{{ s.title }}</span>
          <span class="docs-link-blurb">{{ s.blurb }}</span>
        </a>
      </nav>
    </aside>

    <main class="docs-main">
      <div class="docs-intro">
        <h1>Docs</h1>
        <p>
          Common patterns for using <code>@respeak/lucide-motion-vue</code>.
          Every example has a live preview and a copy-paste snippet. For the
          icon catalogue, see <a href="#/">Browse</a>.
        </p>
      </div>

      <QuickstartSection />
      <ButtonsSection />
      <VariantsSection />
      <ColorSection />
      <ProgrammaticSection />
      <AgentsSection />

      <footer class="foot">
        <span>
          SVG from <a href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a>
          · variants adapted from
          <a href="https://github.com/imskyleen/animate-ui" target="_blank" rel="noreferrer">animate-ui</a>
          · animation via
          <a href="https://motion.dev/docs/vue" target="_blank" rel="noreferrer">Motion for Vue</a>.
        </span>
      </footer>
    </main>
  </div>
</template>
