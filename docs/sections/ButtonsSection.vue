<script setup lang="ts">
import { AnimateIcon, Heart, Trash2, Download } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

const snippet = `<script setup lang="ts">
import { AnimateIcon, Heart } from '@respeak/lucide-motion-vue'
<\/script>

<template>
  <AnimateIcon animateOnHover as="template" v-slot="{ on }">
    <button v-on="on" class="btn">
      <Heart :size="18" />
      Favorite
    </button>
  </AnimateIcon>
</template>`

const hoverTargetSnippet = `<script setup lang="ts">
import { Heart } from '@respeak/lucide-motion-vue'
<\/script>

<template>
  <button class="btn">
    <Heart :size="18" animateOnHover hover-target="parent" />
    Favorite
  </button>
</template>`

const vuetifySnippet = `<AnimateIcon animateOnHover as="template" v-slot="{ on }">
  <v-btn color="primary" v-on="on">
    <Heart :size="18" class="mr-2" />
    Favorite
  </v-btn>
</AnimateIcon>`
</script>

<template>
  <section class="doc-section" id="buttons">
    <h2>Icons in buttons</h2>
    <p>
      Users expect the <em>whole</em> button to be the trigger — not just the
      11×11px SVG. Wrap the button in <code>&lt;AnimateIcon&gt;</code> with
      <code>as="template"</code>, and bind the exposed <code>on</code> object
      to your button. The wrapper renders nothing itself; it just forwards
      hover/tap events into the icon via <code>provide/inject</code>.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <AnimateIcon animateOnHover as="template" v-slot="{ on }">
          <button v-on="on" class="demo-btn">
            <Heart :size="18" />
            Favorite
          </button>
        </AnimateIcon>

        <AnimateIcon animateOnHover as="template" v-slot="{ on }">
          <button v-on="on" class="demo-btn demo-btn-danger">
            <Trash2 :size="18" />
            Delete
          </button>
        </AnimateIcon>

        <AnimateIcon animateOnHover as="template" v-slot="{ on }">
          <button v-on="on" class="demo-btn demo-btn-ghost">
            <Download :size="18" />
            Download
          </button>
        </AnimateIcon>
      </div>
      <CodeBlock :code="snippet" lang="vue" />
    </div>

    <h3>Leaner: <code>hoverTarget</code> on the icon</h3>
    <p>
      For the most common case — button owns the hover area — you don't need
      the wrapper at all. Set <code>hoverTarget="parent"</code> (or any
      <code>closest:</code> selector) directly on the icon and the button's
      hover drives the animation, with zero extra markup.
    </p>
    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <button class="demo-btn">
          <Heart :size="18" animateOnHover hover-target="parent" />
          Favorite
        </button>
        <button class="demo-btn demo-btn-danger">
          <Trash2 :size="18" animateOnHover hover-target="parent" />
          Delete
        </button>
        <button class="demo-btn demo-btn-ghost">
          <Download :size="18" animateOnHover hover-target="parent" />
          Download
        </button>
      </div>
      <CodeBlock :code="hoverTargetSnippet" lang="vue" />
    </div>

    <h3>With Vuetify</h3>
    <p>
      Same pattern — the scoped slot works on any element, including
      <code>&lt;v-btn&gt;</code>.
    </p>
    <CodeBlock :code="vuetifySnippet" lang="vue" />

    <h3>Wrapping multiple icons</h3>
    <p>
      You can also use <code>&lt;AnimateIcon&gt;</code> in its default
      <code>span</code> mode to drive several icons from one trigger zone.
      Good for toolbars and icon-only controls.
    </p>
    <CodeBlock
      code="<AnimateIcon animateOnHover>
  <Heart :size=&quot;20&quot; />
  <Trash2 :size=&quot;20&quot; />
</AnimateIcon>"
      lang="vue"
    />
  </section>
</template>
