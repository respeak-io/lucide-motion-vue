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

  it.each(entries)('$name renders an svg with a valid viewBox', ({ component }) => {
    const wrapper = mount(component, {
      // No triggers: should render the bare <motion.svg> branch, not the
      // self-wrapped one. This is the most common consumer shape (icons
      // sized via :size or CSS, animation managed by an outer AnimateIcon).
      props: { size: 24 },
      attachTo: document.body,
    })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    // Most icons are 24×24; a handful (e.g. flask, syringe ported from
    // upstream variants) use 512×512. Accept any zero-origin viewBox.
    expect(svg.attributes('viewBox')).toMatch(/^0 0 \d+ \d+$/)
    wrapper.unmount()
  })

  it.each(entries)('$name renders the self-wrapped branch with animateOnHover', ({ component }) => {
    const wrapper = mount(component, {
      props: { animateOnHover: true, size: 24 },
      attachTo: document.body,
    })
    // Self-wrapped now renders the bare svg directly (no span wrapper) —
    // <AnimateIcon> forwards events/refs onto the slot's first vnode via
    // cloneVNode + mergeProps. Asserting absence of the span locks in the
    // #5 layout fix against re-introducing a wrapper.
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('span').exists()).toBe(false)
    wrapper.unmount()
  })
})
