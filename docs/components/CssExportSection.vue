<script setup lang="ts">
// Shared "no-JS export" section for the icon drawer and the playground. When
// the (icon, variant) translates faithfully to plain CSS we offer a copy
// button plus a disclosure with a live preview of the exported markup and the
// code itself; otherwise we explain why and point at the component.
//
// The copied artifact is inline SVG + a <style> block (no JS), so it's
// labelled "SVG + CSS" / "copy code" rather than "copy CSS".
import { computed } from 'vue'
import CodeBlock from './CodeBlock.vue'
import CopyButton from './CopyButton.vue'
import { useCssExport } from '../composables/use-css-export'

const props = defineProps<{ kebab: string; variant: string }>()

const { getCode, isPortable, reasonFor } = useCssExport()
const portable = computed(() => isPortable(props.kebab, props.variant))
const code = computed(() => getCode(props.kebab, props.variant))
const reason = computed(() => reasonFor(props.kebab, props.variant))
</script>

<template>
  <div class="cx">
    <div class="cx-head">
      <span class="cx-title">No JS <em>· SVG + CSS</em></span>
      <CopyButton v-if="portable && code" :text="code" label="copy code" />
    </div>

    <p v-if="portable && code" class="cx-note">
      The <strong>component</strong> is the recommended, fully-supported way to use these.
      This no-JS export is best-effort — some variants may not match exactly.
    </p>

    <details v-if="portable && code" class="cx-disclosure">
      <summary>
        <svg
          class="cx-chevron"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        Preview &amp; code
      </summary>
      <div class="cx-body">
        <!--
          Live preview of the exported markup. It's the real thing — inline
          SVG + a scoped <style> — so hovering it plays the pure-CSS animation,
          loops auto-play. Compare against the lib version above.
        -->
        <div class="cx-preview">
          <div class="cx-preview-icon" v-html="code" />
          <span class="cx-hint">pure CSS — hover to replay</span>
        </div>
        <div class="cx-code">
          <CodeBlock :code="code" lang="text" :copyable="false" />
        </div>
      </div>
    </details>

    <div v-else class="cx-unavailable">
      <p>This variant {{ reason }}, so there’s no faithful no-JS version — use the component:</p>
      <CodeBlock code="npm i @respeak/lucide-motion-vue" lang="bash" />
    </div>
  </div>
</template>

<style scoped>
.cx-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.cx-title {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg);
  opacity: 0.75;
}
.cx-title em { font-style: normal; font-weight: 400; opacity: 0.6; }
/* shared copy button is absolutely positioned to overlay a code block; inline
   in this header it must flow normally instead of flying to a corner */
.cx-head :deep(.copy-btn) { position: static; }

.cx-note {
  font-size: 0.74rem;
  line-height: 1.5;
  opacity: 0.65;
  margin: 0 0 10px;
}
.cx-note strong { font-weight: 600; opacity: 0.92; }

.cx-disclosure {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.cx-disclosure > summary {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fg);
  user-select: none;
  list-style: none;
  transition: background 160ms var(--ease-smooth, ease);
}
.cx-disclosure > summary::-webkit-details-marker { display: none; }
.cx-disclosure > summary:hover { background: color-mix(in srgb, var(--fg) 5%, transparent); }
.cx-chevron { flex-shrink: 0; opacity: 0.6; transition: transform 180ms var(--ease-smooth, ease); }
.cx-disclosure[open] > summary > .cx-chevron { transform: rotate(90deg); }

.cx-body { border-top: 1px solid var(--border); }
.cx-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 12px 18px;
  background:
    repeating-linear-gradient(45deg, color-mix(in srgb, var(--fg) 3%, transparent) 0 1px, transparent 1px 9px);
}
.cx-preview-icon {
  color: var(--fg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cx-preview-icon :deep(svg) { width: 52px; height: 52px; }
.cx-hint {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}
.cx-code { max-height: 260px; overflow: auto; border-top: 1px solid var(--border); }

.cx-unavailable p {
  font-size: 0.78rem;
  opacity: 0.7;
  margin: 0 0 8px;
  line-height: 1.5;
}
</style>
