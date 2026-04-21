<script setup lang="ts">
import { computed, ref } from 'vue'
import { Heart } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

type TriggerProp = 'animateOnHover' | 'animateOnTap' | 'animateOnView' | 'animate'

const trigger = ref<TriggerProp>('animateOnHover')
const animation = ref<'default' | 'fill'>('default')
const size = ref(48)
const strokeWidth = ref(2)
const persistOnAnimateEnd = ref(false)

// `animate` branch uses a re-key counter so "play" actually replays.
const playKey = ref(0)
function replay() { playKey.value++ }

const snippet = computed(() => {
  const triggerLine =
    trigger.value === 'animate'
      ? `  :animate="'${animation.value}'"`
      : `  ${trigger.value}${animation.value !== 'default' ? `="${animation.value}"` : ''}`
  const persist = persistOnAnimateEnd.value ? `\n  persistOnAnimateEnd` : ''
  return `<Heart
  :size="${size.value}"
  :strokeWidth="${strokeWidth.value}"${persist}
${triggerLine}
/>`
})
</script>

<template>
  <section class="doc-section" id="props">
    <h2>Props</h2>
    <p>
      Every icon accepts the same prop set. Triggers pick <em>when</em> to
      play; <code>animation</code> picks <em>which</em> named variant; the
      rest tune sizing and end-state behavior. Flip them below to see how the
      combination renders.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-col">
        <div class="demo-stage-icon">
          <Heart
            v-if="trigger === 'animateOnHover'"
            :key="`hover-${animation}-${playKey}`"
            animateOnHover
            :animation="animation"
            :size="size"
            :strokeWidth="strokeWidth"
            :persistOnAnimateEnd="persistOnAnimateEnd"
          />
          <Heart
            v-else-if="trigger === 'animateOnTap'"
            :key="`tap-${animation}-${playKey}`"
            animateOnTap
            :animation="animation"
            :size="size"
            :strokeWidth="strokeWidth"
            :persistOnAnimateEnd="persistOnAnimateEnd"
          />
          <Heart
            v-else-if="trigger === 'animateOnView'"
            :key="`view-${animation}-${playKey}`"
            animateOnView
            :animation="animation"
            :size="size"
            :strokeWidth="strokeWidth"
            :persistOnAnimateEnd="persistOnAnimateEnd"
          />
          <Heart
            v-else
            :key="`animate-${animation}-${playKey}`"
            :animate="animation"
            :animation="animation"
            :size="size"
            :strokeWidth="strokeWidth"
            :persistOnAnimateEnd="persistOnAnimateEnd"
          />
        </div>

        <div class="props-playground">
          <label class="pp-row">
            <span>Trigger</span>
            <select v-model="trigger">
              <option value="animateOnHover">animateOnHover</option>
              <option value="animateOnTap">animateOnTap</option>
              <option value="animateOnView">animateOnView</option>
              <option value="animate">animate (programmatic)</option>
            </select>
          </label>
          <label class="pp-row">
            <span>animation</span>
            <select v-model="animation">
              <option value="default">default</option>
              <option value="fill">fill</option>
            </select>
          </label>
          <label class="pp-row">
            <span>size</span>
            <input type="range" min="16" max="96" v-model.number="size" />
            <code class="pp-value">{{ size }}px</code>
          </label>
          <label class="pp-row">
            <span>strokeWidth</span>
            <input type="range" min="1" max="4" step="0.25" v-model.number="strokeWidth" />
            <code class="pp-value">{{ strokeWidth }}</code>
          </label>
          <label class="pp-row pp-row-check">
            <input type="checkbox" v-model="persistOnAnimateEnd" />
            <span>persistOnAnimateEnd</span>
          </label>
          <button class="demo-btn" type="button" @click="replay">Replay</button>
        </div>
      </div>
      <CodeBlock :code="snippet" lang="vue" />
    </div>

    <h3>Icon props</h3>
    <div class="prop-table-wrap">
      <table class="prop-table">
        <thead>
          <tr><th>prop</th><th>type</th><th>default</th><th>description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>size</code></td>
            <td><code>number</code></td>
            <td><code>28</code></td>
            <td>Rendered width/height in px.</td>
          </tr>
          <tr>
            <td><code>strokeWidth</code></td>
            <td><code>number</code></td>
            <td><code>2</code></td>
            <td>SVG stroke width.</td>
          </tr>
          <tr>
            <td><code>animate</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Programmatic trigger. Pass a variant name to select it.</td>
          </tr>
          <tr>
            <td><code>animateOnHover</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play while hovered.</td>
          </tr>
          <tr>
            <td><code>animateOnTap</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play while pointer is down.</td>
          </tr>
          <tr>
            <td><code>animateOnView</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play when the icon enters the viewport.</td>
          </tr>
          <tr>
            <td><code>animation</code></td>
            <td><code>string</code></td>
            <td><code>'default'</code></td>
            <td>Which named variant group to pull from (e.g. <code>fill</code>).</td>
          </tr>
          <tr>
            <td><code>persistOnAnimateEnd</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Keep final state instead of returning to <code>initial</code>.</td>
          </tr>
          <tr>
            <td><code>initialOnAnimateEnd</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Force snap to <code>initial</code> when animation ends.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted">
      String form of any trigger selects a named variant
      (e.g. <code>animateOnHover=&quot;fill&quot;</code>). Available variants
      are icon-specific — see <a href="#/docs/variants">Variants</a> for how
      to discover them at runtime.
    </p>

    <h3><code>&lt;AnimateIcon&gt;</code> wrapper props</h3>
    <p>
      <code>&lt;AnimateIcon&gt;</code> shares the same trigger/animation props
      so you can drive a group of icons — or a whole button — from one place.
      See <a href="#/docs/buttons">Icons in buttons</a> for the scoped-slot
      pattern.
    </p>
    <div class="prop-table-wrap">
      <table class="prop-table">
        <thead>
          <tr><th>prop</th><th>type</th><th>default</th><th>description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>animate</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Programmatic trigger. Pass a variant name to select it.</td>
          </tr>
          <tr>
            <td><code>animateOnHover</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play while hovered.</td>
          </tr>
          <tr>
            <td><code>animateOnTap</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play while pointer is down.</td>
          </tr>
          <tr>
            <td><code>animateOnView</code></td>
            <td><code>boolean | string</code></td>
            <td><code>false</code></td>
            <td>Play when the wrapper enters the viewport.</td>
          </tr>
          <tr>
            <td><code>animation</code></td>
            <td><code>string</code></td>
            <td><code>'default'</code></td>
            <td>Which named variant group to pull from.</td>
          </tr>
          <tr>
            <td><code>persistOnAnimateEnd</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Keep final state instead of returning to <code>initial</code>.</td>
          </tr>
          <tr>
            <td><code>initialOnAnimateEnd</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Force snap to <code>initial</code> when animation ends.</td>
          </tr>
          <tr>
            <td><code>as</code></td>
            <td><code>'span' | 'template'</code></td>
            <td><code>'span'</code></td>
            <td>Rendering mode — see below.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3>Rendering modes</h3>
    <ul class="doc-list">
      <li>
        <code>as=&quot;span&quot;</code> (default) — renders an
        <code>inline-flex</code> <code>&lt;span&gt;</code> that catches
        pointer events and exposes a <code>viewRef</code> for
        <code>animateOnView</code>. Good for grouping a small cluster of icons.
      </li>
      <li>
        <code>as=&quot;template&quot;</code> — renderless: exposes
        <code>{ on, viewRef }</code> via the default scoped slot so you can
        bind them to any element (<code>&lt;button&gt;</code>,
        <code>&lt;v-btn&gt;</code>, <code>&lt;a&gt;</code>, whole cards).
        Nothing extra in the DOM.
      </li>
    </ul>
    <p class="muted">
      Infinite-loop icons (<code>LoaderCircle</code>, <code>Loader</code>,
      <code>LoaderPinwheel</code>, …) bake <code>repeat: Infinity</code> into
      their variants, so they loop as soon as you set any trigger.
    </p>
  </section>
</template>
