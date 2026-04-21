import { onMounted, ref, watch } from 'vue'

const KEY = 'lucide-motion-vue:icon-color'

function apply(c: string | null) {
  const root = document.documentElement
  if (c) root.style.setProperty('--icon-color', c)
  else root.style.removeProperty('--icon-color')
}

// `null` means "use current text color" (CSS var falls through to --fg).
export function useIconColor() {
  const iconColor = ref<string | null>(null)

  watch(iconColor, c => {
    apply(c)
    try {
      if (c) localStorage.setItem(KEY, c)
      else localStorage.removeItem(KEY)
    } catch {}
  })

  onMounted(() => {
    try {
      const c = localStorage.getItem(KEY)
      if (c) iconColor.value = c
      apply(iconColor.value)
    } catch {}
  })

  return { iconColor }
}
