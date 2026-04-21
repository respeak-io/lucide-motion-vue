<script setup lang="ts">
import { Heart, Star, Bell } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

const snippet = `<!-- Any of these work, including fill animations -->
<Heart animateOnHover class="text-rose-500" />
<Heart animateOnHover animation="fill" style="color: #4f46e5" />

<!-- Color cascades through any ancestor -->
<div style="color: var(--my-brand)">
  <Heart animateOnHover />
</div>`
</script>

<template>
  <section class="doc-section" id="color">
    <h2>Color</h2>
    <p>
      Icons use <code>stroke="currentColor"</code> and, for fill-based
      variants, <code>fill: 'currentColor'</code>. That means color is driven
      by whatever <code>color</code> value is in scope — same pattern as
      <code>lucide-vue-next</code>. No icon-specific color prop to remember.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <div style="color: #ec4899">
          <Heart animateOnHover animation="fill" :size="40" />
        </div>
        <div style="color: #f59e0b">
          <Star animateOnHover :size="40" />
        </div>
        <div style="color: #4f46e5">
          <Bell animateOnHover :size="40" />
        </div>
      </div>
      <CodeBlock :code="snippet" lang="vue" />
    </div>

    <h3>Tailwind</h3>
    <p>
      Any utility that sets <code>color</code> works —
      <code>text-rose-500</code>, <code>text-primary</code>,
      <code>dark:text-slate-100</code>, etc.
    </p>

    <h3>Fill variants</h3>
    <p>
      When a variant animates the <code>fill</code> (like
      <code>Heart</code>'s <code>fill</code> variant), it tweens to
      <code>currentColor</code>, so the filled state automatically matches
      whatever the stroke already shows. No extra config required.
    </p>
  </section>
</template>
