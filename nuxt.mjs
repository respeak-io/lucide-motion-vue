// Nuxt module for @respeak/lucide-motion-vue.
//
// Registers <AnimateIcon> plus every icon as a Nuxt auto-import. Default
// naming is suffixed (<HeartAnimated>, <StarAnimated>, …) so the module
// coexists cleanly with `lucide-vue-next`'s static <Heart>, <Star> etc. —
// no collision, no wrapper imports, nothing to configure out of the box.
//
// Usage (inside a Nuxt app):
//
//   // nuxt.config.ts
//   export default defineNuxtConfig({
//     modules: ['@respeak/lucide-motion-vue/nuxt'],
//   })
//
//   <!-- any .vue file -->
//   <HeartAnimated animateOnHover />
//   <LinkTwoAnimated animateOnTap animation="unlink" />
//   <AnimateIcon animateOnHover> ... </AnimateIcon>
//
// Override naming if you want something shorter:
//
//   export default defineNuxtConfig({
//     modules: ['@respeak/lucide-motion-vue/nuxt'],
//     lucideMotion: { prefix: 'M', suffix: '' },  // → <MHeart>, <MLinkTwo>
//   })

import { defineNuxtModule, addComponent } from '@nuxt/kit'
import { iconsMeta } from '@respeak/lucide-motion-vue'

export default defineNuxtModule({
  meta: {
    name: '@respeak/lucide-motion-vue',
    configKey: 'lucideMotion',
    compatibility: { nuxt: '^3.0.0' },
  },
  defaults: {
    prefix: '',
    suffix: 'Animated',
  },
  setup(options) {
    // The wrapper is always registered under its canonical name — nothing
    // common in a Nuxt app collides with <AnimateIcon>.
    addComponent({
      name: 'AnimateIcon',
      export: 'AnimateIcon',
      filePath: '@respeak/lucide-motion-vue',
    })

    // Each icon gets its own auto-import entry pointing at the per-icon
    // subpath. Nuxt's component loader preserves per-chunk tree-shaking, so
    // a template that only references <HeartAnimated> ships just heart.js.
    const prefix = options.prefix ?? ''
    const suffix = options.suffix ?? ''

    for (const meta of iconsMeta) {
      addComponent({
        name: `${prefix}${meta.pascal}${suffix}`,
        export: 'default',
        filePath: `@respeak/lucide-motion-vue/icons/${meta.kebab}`,
      })
    }
  },
})
