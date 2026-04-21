<script setup lang="ts">
import { ref } from 'vue'
import { fireConfetti } from '../composables/use-confetti'

const props = defineProps<{ text: string; label?: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function onClick(event: MouseEvent) {
  // Capture the button's position BEFORE awaiting — `event.currentTarget`
  // is nulled out by the DOM once dispatch returns, and `await` yields past
  // that point. Missing this was why no confetti appeared originally.
  const btn = event.currentTarget as HTMLElement | null
  const r = btn?.getBoundingClientRect()

  try {
    await navigator.clipboard.writeText(props.text)
  } catch {
    return
  }
  copied.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)

  if (r) fireConfetti(r.left + r.width / 2, r.top + r.height / 2)
}
</script>

<template>
  <button class="copy-btn" :class="{ copied }" @click="onClick">
    <svg
      v-if="!copied"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
    {{ copied ? 'copied' : label ?? 'copy' }}
  </button>
</template>
