<script setup lang="ts">
import { ref } from 'vue'
import { Bell, LoaderCircle, Check } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

// --- Notification demo: toggle `animate` to replay a bell animation ---
const notifyKey = ref(0)
function ring() { notifyKey.value++ }

// --- Async submit demo: swap icon + variant based on state ---
type Status = 'idle' | 'loading' | 'done'
const status = ref<Status>('idle')
async function submit() {
  if (status.value === 'loading') return
  status.value = 'loading'
  await new Promise(r => setTimeout(r, 1200))
  status.value = 'done'
  setTimeout(() => (status.value = 'idle'), 1200)
}

const ringSnippet = `<script setup lang="ts">
import { ref } from 'vue'
import { Bell } from '@respeak/lucide-motion-vue'

// Re-keying forces the icon to remount and replay its mount animation.
// This is the simplest way to trigger a one-shot from imperative code.
const key = ref(0)
function ring() { key.value++ }
<\/script>

<template>
  <Bell :key="key" animate :size="28" />
  <button @click="ring">Notify</button>
</template>`

const submitSnippet = `<script setup lang="ts">
import { ref } from 'vue'
import { LoaderCircle, Check } from '@respeak/lucide-motion-vue'

type Status = 'idle' | 'loading' | 'done'
const status = ref<Status>('idle')

async function submit() {
  status.value = 'loading'
  await api.submit()
  status.value = 'done'
}
<\/script>

<template>
  <button @click="submit" :disabled="status === 'loading'">
    <LoaderCircle v-if="status === 'loading'" animate :size="16" />
    <Check        v-else-if="status === 'done'" animate :size="16" />
    Submit
  </button>
</template>`

const boundSnippet = `<!-- Bind the \`animate\` prop directly to your own reactive state:
     - false → rest
     - true  → play the default variant
     - "fill" (string) → play that named variant -->
<Heart :animate="isFavorited ? 'fill' : false" />`
</script>

<template>
  <section class="doc-section" id="programmatic">
    <h2>Programmatic</h2>
    <p>
      Triggers like <code>animateOnHover</code> are great for affordances,
      but sometimes the animation should happen because <em>your code</em>
      decided it should — a notification arrived, a save completed, a
      state flipped. The <code>animate</code> prop is how.
    </p>

    <h3>Replay on command</h3>
    <p>
      The simplest pattern: re-key the icon to force it to remount, which
      replays the mount animation. Works for any one-shot icon.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <Bell :key="notifyKey" animate :size="36" />
        <button class="demo-btn" @click="ring">Notify</button>
      </div>
      <CodeBlock :code="ringSnippet" lang="vue" />
    </div>

    <h3>Driven by state</h3>
    <p>
      Icons that bake <code>repeat: Infinity</code> into their variants
      (<code>LoaderCircle</code>, <code>Loader</code>,
      <code>LoaderPinwheel</code>, …) loop as soon as you mount them with
      <code>animate</code>. Swap out the icon when the state changes.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <button class="demo-btn" :disabled="status === 'loading'" @click="submit">
          <LoaderCircle v-if="status === 'loading'" animate :size="16" />
          <Check        v-else-if="status === 'done'" animate :size="16" />
          <span>{{ status === 'loading' ? 'Submitting…' : status === 'done' ? 'Submitted' : 'Submit' }}</span>
        </button>
      </div>
      <CodeBlock :code="submitSnippet" lang="vue" />
    </div>

    <h3>Binding a variant</h3>
    <p>
      <code>animate</code> accepts a string — the name of a variant. Bind it
      to your state to switch variants declaratively.
    </p>
    <CodeBlock :code="boundSnippet" lang="vue" />

    <p class="muted">
      See the <a href="#/docs/variants">Variants</a> section for how to list
      the variants each icon supports.
    </p>
  </section>
</template>
