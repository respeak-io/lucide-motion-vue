// Dev-only scratch page. Mounts the CSS-export audit UI. Not part of the docs
// build inputs, so it never ships — it's just for eyeballing lib-vs-CSS.
import { createApp } from 'vue'
import CssAudit from './CssAudit.vue'

createApp(CssAudit).mount('#app')
