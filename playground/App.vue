<script setup lang="ts">
import { ref } from 'vue'
// One line, all three. Named imports shake — unused icons are dropped in prod.
import { AnimateIcon, BetweenVerticalStart, Heart } from '@respeak/lucide-motion-vue'

const playing = ref(false)
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
          <h2 class="text-h6 mb-3">6. Button as trigger (<code>as="template"</code>)</h2>
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
</style>
