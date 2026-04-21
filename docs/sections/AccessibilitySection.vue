<script setup lang="ts">
import { Heart, LoaderCircle } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

const decorative = `<button aria-label="Favorite this item">
  <Heart aria-hidden="true" animateOnHover />
</button>`

const meaningful = `<span role="img" aria-label="Loading">
  <LoaderCircle />
</span>`

const reducedMotion = `<!-- Swap to the static import when the user prefers reduced motion. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Heart as HeartAnimated } from '@respeak/lucide-motion-vue'
import { Heart as HeartStatic } from 'lucide-vue-next'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const Icon = computed(() => (reduced ? HeartStatic : HeartAnimated))
<\/script>

<template>
  <component :is="Icon" animateOnHover />
</template>`
</script>

<template>
  <section class="doc-section" id="accessibility">
    <h2>Accessibility</h2>
    <p>
      Icons render as plain <code>&lt;svg&gt;</code> elements, so standard
      SVG a11y patterns apply. Animation is purely visual — it never changes
      the DOM structure or any <code>aria-*</code> state, so screen readers
      aren't affected by it.
    </p>

    <h3>Decorative icons</h3>
    <p>
      If the surrounding label already says the thing, hide the icon from
      assistive tech with <code>aria-hidden=&quot;true&quot;</code>. The
      button itself gets the accessible name.
    </p>
    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <button class="demo-btn" aria-label="Favorite this item">
          <Heart aria-hidden="true" animateOnHover :size="18" />
          Favorite
        </button>
      </div>
      <CodeBlock :code="decorative" lang="vue" />
    </div>

    <h3>Meaningful icons</h3>
    <p>
      For icon-only elements (status pips, spinner badges), expose an
      accessible name on a wrapping <code>role=&quot;img&quot;</code> element
      — or put <code>aria-label</code> on the containing button.
    </p>
    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <span role="img" aria-label="Loading">
          <LoaderCircle :size="28" />
        </span>
      </div>
      <CodeBlock :code="meaningful" lang="vue" />
    </div>

    <h3>Reduced motion</h3>
    <p>
      Respect <code>prefers-reduced-motion</code> by swapping in the static
      equivalent from <code>lucide-vue-next</code> when the user has
      requested less motion. The animated and static components share the
      same geometry, so the swap is visually seamless.
    </p>
    <CodeBlock :code="reducedMotion" lang="vue" />
    <p class="muted">
      Because both libraries export the same names, alias one side
      (<code>HeartAnimated</code> /
      <code>HeartStatic</code>) to keep imports tidy — see
      <a href="#/docs/quickstart">Collision-safe names</a> in Quickstart.
    </p>
  </section>
</template>
