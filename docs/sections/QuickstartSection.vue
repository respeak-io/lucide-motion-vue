<script setup lang="ts">
import { Heart } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

const install = `$ pnpm add @respeak/lucide-motion-vue motion-v`

const usage = `<script setup lang="ts">
import { Heart } from '@respeak/lucide-motion-vue'
<\/script>

<template>
  <Heart animateOnHover :size="32" />
</template>`
</script>

<template>
  <section class="doc-section" id="quickstart">
    <h2>Quickstart</h2>
    <p>
      Every icon is a standalone Vue component. Drop one in, add a trigger prop
      — <code>animateOnHover</code>, <code>animateOnTap</code>, or
      <code>animateOnView</code> — and it animates. Color follows
      <code>currentColor</code>, so it inherits from any surrounding
      <code>color</code> style.
    </p>

    <h3>Install</h3>
    <CodeBlock :code="install" lang="bash" />
    <p class="muted">
      Peer deps: <code>vue ^3.3</code>, <code>motion-v ^1</code>.
    </p>

    <h3>Use</h3>
    <div class="doc-demo">
      <div class="demo-stage">
        <Heart animateOnHover :size="48" />
      </div>
      <CodeBlock :code="usage" lang="vue" />
    </div>
    <p class="muted">Hover the heart. One-shot: plays once per hover.</p>
  </section>
</template>
