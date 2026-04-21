<script setup lang="ts">
import { ref } from 'vue'
import { Heart, Link2, iconsMeta } from '@respeak/lucide-motion-vue'
import CodeBlock from '../components/CodeBlock.vue'

// Live demo: let the user flip between Heart's variants and see the effect.
const heartVariant = ref<'default' | 'fill'>('default')
const link2Variant = ref<'default' | 'apart' | 'unlink' | 'link'>('default')

// Bumped on each pill click so the icon's :key changes, forcing a remount
// that fires `animate` once via the watcher's `immediate: true`. Same-pill
// clicks still bump the counter, so the user can replay an animation.
const heartPlay = ref(0)
const link2Play = ref(0)

function pickHeart(v: 'default' | 'fill') {
  heartVariant.value = v
  heartPlay.value++
}
function pickLink2(v: 'default' | 'apart' | 'unlink' | 'link') {
  link2Variant.value = v
  link2Play.value++
}

const basic = `<Heart animateOnHover animation="fill" :size="32" />`

const discover = `import { iconsMeta } from '@respeak/lucide-motion-vue'

// Every icon's variant list is exported as plain data. Each entry
// carries \`name\` (what you pass to the \`animation\` prop) and
// \`source\` (the upstream project it came from).
iconsMeta.find(m => m.pascal === 'Heart')?.animations
// → [
//     { name: 'default', source: 'animate-ui' },
//     { name: 'fill',    source: 'animate-ui' },
//   ]

iconsMeta.find(m => m.pascal === 'Link2')?.animations.map(a => a.name)
// → ['default', 'apart', 'unlink', 'link']`

const heartMeta = iconsMeta.find(m => m.pascal === 'Heart')
const link2Meta = iconsMeta.find(m => m.pascal === 'Link2')
</script>

<template>
  <section class="doc-section" id="variants">
    <h2>Variants</h2>
    <p>
      Many icons ship multiple named animations. <code>Heart</code> has
      <code>default</code> and <code>fill</code>. <code>Link2</code> has
      <code>default</code>, <code>apart</code>, <code>unlink</code>, and
      <code>link</code>. Pick one by setting the <code>animation</code> prop;
      triggers (<code>animateOnHover</code> etc.) work the same regardless.
    </p>

    <h3>Live</h3>
    <div class="doc-demo">
      <div class="demo-stage demo-stage-col">
        <div class="variant-row">
          <div class="variant-pills">
            <button
              v-for="v in heartMeta?.animations"
              :key="`heart-${v.name}`"
              class="pill"
              :class="{ active: v.name === heartVariant }"
              @click="pickHeart(v.name as any)"
            >
              {{ v.name }}
            </button>
          </div>
          <Heart
            :key="`heart-${heartVariant}-${heartPlay}`"
            animate
            animateOnHover
            initialOnAnimateEnd
            :animation="heartVariant"
            :size="48"
          />
        </div>

        <div class="variant-row">
          <div class="variant-pills">
            <button
              v-for="v in link2Meta?.animations"
              :key="`link-${v.name}`"
              class="pill"
              :class="{ active: v.name === link2Variant }"
              @click="pickLink2(v.name as any)"
            >
              {{ v.name }}
            </button>
          </div>
          <Link2
            :key="`link-${link2Variant}-${link2Play}`"
            animate
            animateOnHover
            initialOnAnimateEnd
            :animation="link2Variant"
            :size="48"
          />
        </div>
      </div>
      <CodeBlock :code="basic" lang="vue" />
    </div>

    <p class="muted">Click a pill to play the variant; hover to replay.</p>

    <h3>Listing variants programmatically</h3>
    <p>
      Every icon's name and variant list is exported as data. Useful for
      building custom pickers, feeding autocomplete, or validating props in
      tests.
    </p>
    <CodeBlock :code="discover" lang="ts" />
  </section>
</template>
