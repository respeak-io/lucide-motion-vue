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

const vuetifySnippet = `<AnimateIcon animateOnHover as="template" v-slot="{ on }">
  <v-btn color="primary" v-on="on">
    <Heart :size="18" class="mr-2" />
    Favorite
  </v-btn>
</AnimateIcon>`

const migrationSnippet = `<!-- Drop-in: the existing button stays untouched. -->
<button class="btn">
  <Heart animateOnHover triggerTarget="parent" :size="18" />
  Favorite
</button>

<!-- Extra wrappers between icon and button? Climb with closest. -->
<button class="btn">
  <span class="flex gap-2">
    <Trash2 animateOnHover triggerTarget="closest:button" :size="18" />
    Delete
  </span>
</button>`
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

    <h3>With Vuetify</h3>
    <p>
      Same pattern — the scoped slot works on any element, including
      <code>&lt;v-btn&gt;</code>.
    </p>
    <CodeBlock :code="vuetifySnippet" lang="vue" />

    <h3>Migrating existing buttons</h3>
    <p>
      Already have <code>&lt;button&gt;&lt;Icon /&gt;&lt;/button&gt;</code>
      markup and just want to animate on button-hover? Set
      <code>triggerTarget="parent"</code> on the icon — no wrapper, no markup
      refactor. If the icon sits inside extra wrappers, use
      <code>triggerTarget="closest:button"</code> (or any selector) to climb
      ancestors. Use <code>as="template"</code> instead when one trigger
      should drive <em>several</em> icons.
    </p>

    <div class="doc-demo">
      <div class="demo-stage demo-stage-row">
        <button class="demo-btn">
          <Heart animateOnHover triggerTarget="parent" :size="18" />
          Favorite
        </button>

        <button class="demo-btn demo-btn-danger">
          <span style="display: inline-flex; gap: 0.5rem; align-items: center">
            <Trash2 animateOnHover triggerTarget="closest:button" :size="18" />
            Delete
          </span>
        </button>
      </div>
      <CodeBlock :code="migrationSnippet" lang="vue" />
    </div>

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
