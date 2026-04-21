import { ref } from 'vue'

export type ConfettiParticle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  rot: number
  color: string
  size: number
  br: string
  dur: number
}

const PALETTE = ['#4f46e5', '#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']

// Shared singleton — one confetti layer mounted in App.vue handles bursts
// from any component. Kept outside the function so all callers share state.
const particles = ref<ConfettiParticle[]>([])
let nextId = 0

export function fireConfetti(cx: number, cy: number, count = 20) {
  const batch: ConfettiParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35
    const distance = 60 + Math.random() * 80
    batch.push({
      id: nextId++,
      x: cx,
      y: cy,
      dx: Math.cos(angle) * distance,
      // slight upward bias so the burst reads as "pop" not "fall"
      dy: Math.sin(angle) * distance - 18,
      rot: (Math.random() - 0.5) * 720,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: 4 + Math.random() * 5,
      br: Math.random() > 0.5 ? '2px' : '50%',
      dur: 800 + Math.random() * 400,
    })
  }
  particles.value.push(...batch)
  const ids = new Set(batch.map(p => p.id))
  setTimeout(() => {
    particles.value = particles.value.filter(p => !ids.has(p.id))
  }, 1400)
}

export function useConfetti() {
  return { particles, fireConfetti }
}
