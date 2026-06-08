import { ref } from 'vue'
import {
  getCssExportStatus,
  isCssPortable,
  type CssExportStatus,
} from '../generated/css-export-index'

// The code strings (svg + <style>) live in docs/public/css-exports.json so the
// ~570kb of markup is fetched on demand instead of bundled into the main docs
// chunk. The portability *status* is a tiny static import, so the UI can decide
// synchronously whether to offer a copy button or a "needs the component" note.
const codes = ref<Record<string, string> | null>(null)
let started = false

function load() {
  if (started) return
  started = true
  fetch(import.meta.env.BASE_URL + 'css-exports.json')
    .then(r => r.json())
    .then(j => { codes.value = j })
    .catch(() => { started = false }) // allow a retry on next mount
}

// Human-readable reason a variant can't be exported, for the disabled note.
const REASONS: Partial<Record<CssExportStatus, string>> = {
  spring: 'uses spring physics',
  'd-morph': 'morphs between path shapes',
  multivariant: 'swaps element graphs between variants',
  unsupported: 'animates a property CSS can’t reproduce',
  parse: 'is generated dynamically at runtime',
  excluded: 'doesn’t translate faithfully to CSS',
}

export function useCssExport() {
  load()
  return {
    codes,
    getCode: (kebab: string, variant: string): string | null =>
      codes.value?.[`${kebab}|${variant}`] ?? null,
    isPortable: isCssPortable,
    getStatus: getCssExportStatus,
    reasonFor: (kebab: string, variant: string): string => {
      const st = getCssExportStatus(kebab, variant)
      return (st && REASONS[st]) || 'needs the component'
    },
  }
}
