import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Structural check on the generator output. The generator (port-icons.mjs)
 * needs network access to clone the upstream repo, so we can't run it in CI
 * to diff against. Instead we verify each generated SFC matches the contract
 * the consumer relies on. Catches the kind of regression where a refactor of
 * the generator silently drops an import or template branch.
 */
const ICONS_DIR = resolve(__dirname, '../../src/icons')
const files: string[] = readdirSync(ICONS_DIR).filter((f: string) => f.endsWith('.vue'))

describe('icons — structural shape', () => {
  it('has 500+ generated icons', () => {
    expect(files.length).toBeGreaterThan(500)
  })

  it.each(files)('%s has the expected SFC shape', (file: string) => {
    const src = readFileSync(resolve(ICONS_DIR, file), 'utf8')

    // Script setup with TS — bare <script setup> would lose TS types.
    expect(src).toMatch(/<script\s+setup\s+lang="ts">/)
    expect(src).toContain('</script>')

    // Both layouts share the trigger-prop surface and self-wrap branch.
    expect(src).toMatch(/import AnimateIcon from ['"]\.\.\/core\/AnimateIcon\.vue['"]/)
    expect(src).toContain('IconTriggerProps')
    expect(src).toContain('hasOwnTriggers')
    expect(src).toContain('<AnimateIcon')

    // Two render layouts coexist:
    //   1. Hand-templated: in-place <motion.svg> with elements baked into the
    //      template; per-element variants come from getVariants(animations).
    //   2. Data-driven: forge-generated multi-variant icons whose element
    //      graphs diverge across animations; delegate to <MultiVariantIcon>
    //      which swaps the active animation's elements at runtime.
    const usesMultiVariantIcon = src.includes('<MultiVariantIcon')

    if (usesMultiVariantIcon) {
      expect(src).toMatch(
        /import MultiVariantIcon from ['"]\.\.\/core\/MultiVariantIcon\.vue['"]/,
      )
      expect(src).toContain('MultiVariantAnimations')
      // No inline <motion.svg> when delegating — the core component handles it.
      expect(src).not.toContain('<motion.svg')
    } else {
      expect(src).toMatch(/from ['"]motion-v['"]/)
      expect(src).toMatch(/from ['"]\.\.\/core\/context['"]/)
      expect(src).toContain('getVariants')
      expect(src).toContain('<motion.svg')
      // Every animation set must define `default` — getVariants() falls back
      // to it, and the consumer's `animation="default"` is the prop default.
      expect(src).toMatch(/animations\s*=\s*{[\s\S]*default\s*:/)
    }
  })
})
