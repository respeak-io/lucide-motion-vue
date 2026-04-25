<script setup lang="ts">
import { ref } from 'vue'
import { AnimateIcon, Heart, BetweenVerticalStart } from '@respeak/lucide-motion-vue'

// Fixture page for Playwright. Each interactive surface gets a stable
// data-testid so the test runner doesn't depend on visual structure. We test
// the public consumer idioms documented in the README:
//   1. self-wrapped icon with animateOnHover
//   2. self-wrapped icon with animateOnTap
//   3. external trigger via the `animate` prop
//   4. delegation via triggerTarget="parent" (button-as-trigger pattern)
//   5. composed <AnimateIcon> wrapping mixed content
//   6. as="template" exposing on/viewRef to a custom element

const playing = ref(false)
</script>

<template>
  <main style="font-family: system-ui; padding: 24px; max-width: 720px;">
    <h1>Fixture</h1>

    <section data-testid="hover-section">
      <h2>Self-wrapped, animateOnHover</h2>
      <Heart data-testid="heart-hover" animateOnHover :size="48" />
    </section>

    <section data-testid="tap-section">
      <h2>Self-wrapped, animateOnTap</h2>
      <BetweenVerticalStart
        data-testid="between-tap"
        animateOnTap
        :size="48"
      />
    </section>

    <section data-testid="controlled-section">
      <h2>Externally controlled via :animate</h2>
      <button data-testid="play-toggle" @click="playing = !playing">
        {{ playing ? 'Stop' : 'Play' }}
      </button>
      <Heart data-testid="heart-controlled" :animate="playing" :size="48" />
    </section>

    <section data-testid="parent-trigger-section">
      <h2>triggerTarget="parent"</h2>
      <button
        data-testid="parent-button"
        style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;"
      >
        <Heart
          data-testid="heart-parent"
          animateOnHover
          triggerTarget="parent"
          :size="20"
        />
        <span>Like</span>
      </button>
    </section>

    <section data-testid="template-section">
      <h2>as="template" on a custom button</h2>
      <AnimateIcon animateOnHover as="template" v-slot="{ on, viewRef }">
        <button
          data-testid="template-button"
          :ref="(el: any) => viewRef?.(el)"
          v-on="on"
          style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;"
        >
          <BetweenVerticalStart :size="20" />
          <span>Align</span>
        </button>
      </AnimateIcon>
    </section>

    <section data-testid="composed-section">
      <h2>Composed wrapper</h2>
      <AnimateIcon animateOnHover>
        <span
          data-testid="composed-pill"
          style="display: inline-flex; align-items: center; gap: 12px;
                 padding: 8px 16px; border: 1px solid #ccc; border-radius: 999px;"
        >
          <BetweenVerticalStart :size="20" />
          <span>Align</span>
          <Heart :size="20" style="color: crimson" />
        </span>
      </AnimateIcon>
    </section>
  </main>
</template>
