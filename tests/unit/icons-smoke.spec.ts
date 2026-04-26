import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'

// Eager glob: import every generated icon SFC and run it through the same
// minimal "does this render an SVG?" check. This is the safety net for the
// `port-icons.mjs` generator — a malformed template, a missing import, or a
// drift in the SFC shape will fail one of these tests immediately.
const modules = import.meta.glob('../../src/icons/*.vue', {
  eager: true,
  import: 'default',
}) as Record<string, Component>

const entries = Object.entries(modules)
  .map(([path, component]) => {
    const name = path.replace(/^.*\/icons\//, '').replace(/\.vue$/, '')
    return { name, component }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

describe('icons — smoke render', () => {
  it('discovers every icon under src/icons (sanity floor)', () => {
    // The README + meta both say 500+; if this number tanks, something
    // accidentally deleted SFCs.
    expect(entries.length).toBeGreaterThan(500)
  })

  // Icons whose template intentionally omits viewBox today. Tracked so the
  // test still catches a *new* missing-viewBox regression introduced by the
  // generator. Shrink this list as the underlying icons are fixed.
  const KNOWN_NO_VIEWBOX = new Set(['facebook'])

  it.each(entries)('$name renders an svg with a valid viewBox', ({ name, component }) => {
    const wrapper = mount(component, {
      // No triggers: should render the bare <motion.svg> branch, not the
      // self-wrapped one. This is the most common consumer shape (icons
      // sized via :size or CSS, animation managed by an outer AnimateIcon).
      props: { size: 24 },
      attachTo: document.body,
    })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    if (!KNOWN_NO_VIEWBOX.has(name)) {
      // Most icons are 24×24; a handful (e.g. flask, syringe ported from
      // upstream variants) use 512×512. Accept any zero-origin viewBox.
      expect(svg.attributes('viewBox')).toMatch(/^0 0 \d+ \d+$/)
    }
    wrapper.unmount()
  })

  it.each(entries)('$name renders the self-wrapped branch with animateOnHover', ({ component }) => {
    const wrapper = mount(component, {
      props: { animateOnHover: true, size: 24 },
      attachTo: document.body,
    })
    // Self-wrapped means: outer span (the AnimateIcon wrapper) → inner svg.
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
    wrapper.unmount()
  })
})
