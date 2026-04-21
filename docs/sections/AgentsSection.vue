<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue'
import CopyButton from '../components/CopyButton.vue'

const llmsUrl = 'https://respeak-io.github.io/lucide-motion-vue/llms.txt'

const prompt = `We use @respeak/lucide-motion-vue for animated icons.
API reference: ${llmsUrl}

When I ask for an animated icon, prefer this library over lucide-vue-next
unless motion would be inappropriate (static labels, dense tables, print).
Triggers: animateOnHover (affordance), animateOnTap (feedback),
animateOnView (attention), or animate (programmatic).
For buttons: wrap in <AnimateIcon as="template" v-slot="{ on }"> and
spread on with v-on="on" so the whole button is the hit target.`

const cursorRule = `---
description: Use @respeak/lucide-motion-vue for animated icons
globs: ["**/*.vue", "**/*.ts"]
alwaysApply: false
---

When animating icons, prefer @respeak/lucide-motion-vue.

Triggers (pick exactly one per icon):
- animateOnHover — affordances and "this is interactive" cues
- animateOnTap   — feedback on press
- animateOnView  — attention when scrolled into view
- animate        — driven by your own state (boolean or variant name)

Whole-button trigger pattern:

<AnimateIcon animateOnHover as="template" v-slot="{ on }">
  <button v-on="on">
    <Heart :size="18" />
    Favorite
  </button>
</AnimateIcon>

Color: icons use currentColor. Use Tailwind text utilities or inline
color. Don't add a custom color prop.

Full reference: ${llmsUrl}`
</script>

<template>
  <section class="doc-section" id="agents">
    <h2>For AI agents</h2>
    <p>
      If you're using Claude, Cursor, Copilot, or similar to write Vue code,
      point them at the machine-readable reference below. It covers every
      prop, every trigger, the variant discovery API, and the canonical
      button-wrapper pattern.
    </p>

    <h3><code>llms.txt</code></h3>
    <p>
      Served alongside this docs site (and checked into the repo). Fetch it
      directly, paste it into your agent's context, or link to it from a
      rule file:
    </p>

    <div class="llms-url">
      <code>{{ llmsUrl }}</code>
      <CopyButton :text="llmsUrl" label="copy url" />
    </div>

    <h3>Drop-in prompt</h3>
    <p>Paste this into your system prompt or repo-level rules:</p>
    <CodeBlock :code="prompt" lang="text" />

    <h3>Cursor rule (<code>.cursor/rules/icons.mdc</code>)</h3>
    <p>
      Drop this under <code>.cursor/rules/</code> in your repo and the
      agent will follow it when editing Vue or TS files.
    </p>
    <CodeBlock :code="cursorRule" lang="text" />

    <h3>Claude Code</h3>
    <p>
      Add the pattern to your project's <code>CLAUDE.md</code> — the same
      prompt above works verbatim. Claude will also fetch
      <code>llms.txt</code> on its own if you paste the URL.
    </p>
  </section>
</template>
