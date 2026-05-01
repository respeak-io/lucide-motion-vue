<script setup lang="ts">
import { ref } from 'vue'
// One line, all three. Named imports shake — unused icons are dropped in prod.
import { AnimateIcon, AudioLines, BetweenVerticalStart, Heart, Search } from '@respeak/lucide-motion-vue'

const playing = ref(false)
const audioVariant = ref<'default' | 'alt'>('default')
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-10" style="max-width: 900px">
        <h1 class="text-h4 mb-6">@respeak/lucide-motion-vue — playground</h1>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">1. Self-wrapped: <code>animateOnHover</code></h2>
          <BetweenVerticalStart animateOnHover :size="48" />
          <Heart animateOnHover :size="48" class="ml-4" style="color: crimson" />
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">
            1a. CSS-sized icon (class wins — <code>:size</code> unset)
          </h2>
          <p class="text-caption mb-2">
            Both icons should render at 72×72. The animated one self-wraps via
            <code>animateOnHover</code>; the class must still reach the svg.
          </p>
          <BetweenVerticalStart class="icon-lg" />
          <Heart animateOnHover class="icon-lg ml-4" style="color: crimson" />
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">
            1b. Absolute-positioned icon inside an input (#5)
          </h2>
          <p class="text-caption mb-2">
            The `lucide-vue-next` icon-in-input idiom: a positioned overlay
            over a block input. Two things to verify on this card —
            <strong>(a)</strong> the input sits flush against this paragraph
            (no ~1em line-box gap above it), and <strong>(b)</strong> the
            magnifying glass is vertically centered inside the input.
          </p>
          <p class="text-caption mb-2">
            <strong>Note:</strong> motion-v writes an inline
            <code>transform: none</code> on the rendered svg, which beats any
            class-defined transform. So <code>translateY(-50%)</code> for
            centering must be applied via inline <code>style</code>, not via
            a CSS class. See the <code>style="…"</code> attribute below.
          </p>
          <div class="input-shell">
            <Search
              animateOnHover
              style="position: absolute; left: 10px; top: 50%;
                     transform: translateY(-50%); width: 18px; height: 18px;
                     color: #666; pointer-events: none;"
            />
            <input class="input-field" placeholder="Search" />
          </div>
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">2. Self-wrapped: <code>animateOnTap</code></h2>
          <BetweenVerticalStart animateOnTap :size="48" />
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">3. Named animation variant + loop</h2>
          <BetweenVerticalStart animateOnHover animation="default-loop" loop :size="48" />
          <Heart animateOnHover animation="fill" loop :size="48" class="ml-4" style="color: crimson" />
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">4. Controlled via <code>animate</code> prop</h2>
          <v-btn class="mb-3" @click="playing = !playing">
            {{ playing ? 'Stop' : 'Play' }}
          </v-btn>
          <div>
            <BetweenVerticalStart :animate="playing" :size="48" />
          </div>
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">5. Composed <code>&lt;AnimateIcon&gt;</code></h2>
          <AnimateIcon animateOnHover>
            <span
              style="display: inline-flex; align-items: center; gap: 12px;
                     padding: 8px 16px; border: 1px solid #ccc; border-radius: 999px;"
            >
              <BetweenVerticalStart :size="28" />
              <span>Align</span>
              <Heart :size="28" style="color: crimson" />
            </span>
          </AnimateIcon>
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">
            6. Multi-variant icon (different element graphs)
          </h2>
          <p class="text-caption mb-2">
            <code>&lt;AudioLines&gt;</code> ships two variants whose silhouettes
            diverge: <code>default</code> renders six animated lines (animate-ui),
            <code>alt</code> renders four animated paths flanked by two static
            caps (lucide-animated). The toggle below flips the active animation
            via the <code>animation</code> prop — a single component, two real
            silhouettes, no <code>&lt;AudioLines2&gt;</code> sibling.
          </p>
          <div class="d-flex align-center" style="gap: 24px">
            <v-btn-toggle v-model="audioVariant" color="primary" mandatory density="comfortable">
              <v-btn value="default">default</v-btn>
              <v-btn value="alt">alt</v-btn>
            </v-btn-toggle>
            <AudioLines :animation="audioVariant" animateOnHover :size="48" />
          </div>
          <p class="text-caption mt-3 mb-0">
            Both variants visible side-by-side (each persistently animating):
          </p>
          <div class="d-flex align-center mt-2" style="gap: 32px">
            <div class="d-flex flex-column align-center" style="gap: 6px">
              <AudioLines animation="default" animate :size="48" />
              <code class="text-caption">default</code>
            </div>
            <div class="d-flex flex-column align-center" style="gap: 6px">
              <AudioLines animation="alt" animate :size="48" />
              <code class="text-caption">alt</code>
            </div>
          </div>
        </v-card>

        <v-card class="pa-6 mb-4">
          <h2 class="text-h6 mb-3">7. Button as trigger (<code>as="template"</code>)</h2>
          <AnimateIcon animateOnHover as="template" v-slot="{ on }">
            <v-btn color="primary" v-on="on">
              <BetweenVerticalStart :size="20" class="mr-2" />
              Align columns
            </v-btn>
          </AnimateIcon>

          <AnimateIcon animateOnHover animation="fill" as="template" v-slot="{ on }">
            <v-btn color="error" variant="outlined" class="ml-3" v-on="on">
              <Heart :size="20" class="mr-2" />
              Like
            </v-btn>
          </AnimateIcon>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/*
  Not scoped on purpose — scoped selectors only attach `data-v-*` to a child
  component's root, so with a self-wrapped icon they'd match the span wrapper
  but not the inner svg. Global rules mirror how consumers ship utility CSS
  (Tailwind, a global app.css, etc.).
*/
.icon-lg {
  width: 72px;
  height: 72px;
}

.input-shell {
  position: relative;
  max-width: 320px;
}
.input-field {
  display: block;
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>
