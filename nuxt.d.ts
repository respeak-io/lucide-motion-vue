import type { NuxtModule } from '@nuxt/schema'

export interface ModuleOptions {
  /**
   * Prefix prepended to each auto-registered component name.
   *
   * @default ''
   */
  prefix?: string
  /**
   * Suffix appended to each auto-registered component name.
   *
   * Defaults to `'Animated'` so components are exposed as `<HeartAnimated>`,
   * `<StarAnimated>`, etc. — keeping the module collision-free next to
   * `lucide-vue-next`'s static `<Heart>`, `<Star>`. Set to `''` (and optionally
   * provide a `prefix`) if you want a different scheme.
   *
   * @default 'Animated'
   */
  suffix?: string
}

declare const module: NuxtModule<ModuleOptions>
export default module

declare module '@nuxt/schema' {
  interface NuxtConfig {
    lucideMotion?: ModuleOptions
  }
  interface NuxtOptions {
    lucideMotion?: ModuleOptions
  }
}
