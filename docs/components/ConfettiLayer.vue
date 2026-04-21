<script setup lang="ts">
import { useConfetti } from '../composables/use-confetti'

const { particles } = useConfetti()
</script>

<template>
  <Teleport to="body">
    <div class="confetti-layer" aria-hidden="true">
      <div
        v-for="p in particles"
        :key="p.id"
        class="confetti-piece"
        :style="{
          left: p.x + 'px',
          top: p.y + 'px',
          '--dx': p.dx + 'px',
          '--dy': p.dy + 'px',
          '--rot': p.rot + 'deg',
          '--color': p.color,
          '--size': p.size + 'px',
          '--br': p.br,
          '--dur': p.dur + 'ms',
        }"
      />
    </div>
  </Teleport>
</template>
