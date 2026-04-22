<script setup lang="ts">
// No imports — components are auto-registered by the Nuxt module.
</script>

<template>
  <main class="playground">
    <h1>lucide-motion-vue Nuxt playground</h1>
    <p>Hover the icons. All components are auto-imported via <code>@respeak/lucide-motion-vue/nuxt</code>.</p>

    <section class="grid">
      <HeartAnimated animateOnHover :size="48" />
      <StarAnimated animateOnHover :size="48" />
      <BellAnimated animateOnHover :size="48" />
      <SparklesAnimated animateOnHover :size="48" />
      <RocketAnimated animateOnHover :size="48" />
      <LoaderCircleAnimated animate :size="48" />
      <Link2Animated animateOnHover animation="unlink" :size="48" />
      <SendAnimated animateOnHover clip :size="48" />
    </section>

    <section class="wrapper">
      <h2>Wrapper pattern</h2>
      <AnimateIcon animateOnHover as="template" v-slot="{ on }">
        <button class="btn" v-on="on">
          <HeartAnimated :size="20" />
          <span>Favorite</span>
        </button>
      </AnimateIcon>
    </section>
  </main>
</template>

<style>
body { font-family: system-ui, sans-serif; margin: 2rem; }
.grid { display: flex; gap: 1.5rem; margin: 1.5rem 0; flex-wrap: wrap; }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px;
  background: #fafafa; cursor: pointer; font: inherit;
}
.btn:hover { background: #f0f0f0; }
code { font-family: ui-monospace, monospace; background: #f3f3f3; padding: 2px 6px; border-radius: 4px; }
</style>
