import { onMounted, ref, watch } from 'vue'

export type Theme = 'system' | 'light' | 'dark'

const KEY = 'lucide-motion-vue:theme'

function apply(t: Theme) {
  const root = document.documentElement
  if (t === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t)
}

export function useTheme() {
  const theme = ref<Theme>('system')

  function cycle() {
    theme.value =
      theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system'
  }

  watch(theme, t => {
    apply(t)
    try { localStorage.setItem(KEY, t) } catch {}
  })

  onMounted(() => {
    try {
      const t = localStorage.getItem(KEY) as Theme | null
      if (t === 'light' || t === 'dark' || t === 'system') theme.value = t
      apply(theme.value)
    } catch {}
  })

  return { theme, cycle }
}
