<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { motion } from 'motion-v'
import type { Proposal, SvgElement } from '../server/schema'
import { rehydrateVariants } from '../server/sanitize'
import MorphPath from '../../src/core/MorphPath.vue'

const props = withDefaults(
  defineProps<{
    proposal: Proposal
    size?: number
    /**
     * 'loop' = animation auto-plays and re-mounts every `loopGap` ms so
     *          one-shots replay (and looped variants stay in their natural
     *          rhythm).
     * 'hover' = play once on mouseenter, reset on mouseleave.
     */
    mode?: 'loop' | 'hover'
    loopGap?: number
  }>(),
  { size: 96, mode: 'loop', loopGap: 2800 },
)

const trigger = ref<'initial' | 'animate'>('initial')
const size = computed(() => props.size)

// Bumping `epoch` re-keys the `<motion.svg>`, which forces a clean re-mount.
// motion-v needs this for variants that read DOM measurements at mount time
// (pathLength, pathOffset, getTotalLength), and it's the simplest way to
// loop one-shot animations without injecting `repeat: Infinity` into every
// transition (which would clobber durations baked into the proposal).
const epoch = ref(0)
let loopTimer: number | undefined

function startLoop() {
  // First play on mount, then a re-mount + replay every loopGap ms.
  trigger.value = 'animate'
  loopTimer = window.setInterval(() => {
    epoch.value++
    trigger.value = 'initial'
    // Next frame: flip back to animate. Without the rAF, motion-v sometimes
    // skips the initial → animate transition because both flips happen
    // before reconciliation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        trigger.value = 'animate'
      })
    })
  }, props.loopGap)
}

function stopLoop() {
  if (loopTimer !== undefined) {
    window.clearInterval(loopTimer)
    loopTimer = undefined
  }
}

onMounted(() => {
  if (props.mode === 'loop') startLoop()
})
onUnmounted(stopLoop)

function onEnter() {
  if (props.mode === 'hover') {
    epoch.value++
    trigger.value = 'animate'
  }
}
function onLeave() {
  if (props.mode === 'hover') trigger.value = 'initial'
}

function attrsFor(el: SvgElement): Record<string, string | number> {
  return el.attrs ?? {}
}

// Rehydrate "Infinity" strings (JSON-safe) → JS Infinity numbers so motion-v's
// `repeat` actually loops. Without this every icon with `repeat: Infinity` in
// its transition plays once and sits.
const sanitizedVariants = computed(() => rehydrateVariants(props.proposal.variants))
</script>

<template>
  <div
    class="preview"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <motion.svg
      :key="epoch"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      overflow="visible"
    >
      <template v-for="(el, i) in proposal.elements" :key="i">
        <!-- Morphing path: paths[] takes precedence over attrs.d -->
        <MorphPath
          v-if="el.tag === 'path' && el.paths && el.paths.length >= 2"
          :paths="el.paths"
          :variants="el.key ? sanitizedVariants[el.key] : undefined"
          initial="initial"
          :animate="trigger"
        />
        <component
          v-else-if="el.key && sanitizedVariants[el.key]"
          :is="(motion as any)[el.tag]"
          v-bind="attrsFor(el)"
          :variants="sanitizedVariants[el.key]"
          initial="initial"
          :animate="trigger"
        />
        <component
          v-else
          :is="el.tag"
          v-bind="attrsFor(el)"
        />
      </template>
    </motion.svg>
  </div>
</template>

<style scoped>
.preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 12px;
  background: #fafafa;
  color: #111;
}
</style>
