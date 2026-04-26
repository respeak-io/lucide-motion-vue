import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// We mock motion-v so the test doubles down on AnimateIcon's *behaviour*,
// not real animation. `useInView` is replaced with a controllable ref kept
// in module-scope so individual tests can flip it.
const inViewRef = ref(false)
vi.mock('motion-v', () => ({
  useInView: () => inViewRef,
}))

import AnimateIcon from '../../src/core/AnimateIcon.vue'
import { AnimateIconKey, type AnimateIconContext } from '../../src/core/context'

beforeEach(() => {
  inViewRef.value = false
})

afterEach(() => {
  vi.useRealTimers()
})

// Mounts AnimateIcon with a tiny child that captures the provided context.
// Returns helpers that target the slot's first vnode (the inner svg). With
// the wrapperless self-wrap, AnimateIcon no longer renders a span — events,
// the viewRef, and consumer attrs are forwarded onto the svg via cloneVNode
// + mergeProps. mouseenter doesn't bubble, so dispatching directly on the
// svg is the only reliable way to fire the synthesized handlers.
function mountIcon(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const captured: { ctx: AnimateIconContext | null } = { ctx: null }
  const Probe = defineComponent({
    setup() {
      captured.ctx = inject(AnimateIconKey, null)
      return () => null
    },
  })
  const wrapper = mount(AnimateIcon, {
    props,
    attrs,
    attachTo: document.body,
    slots: {
      default: () => h('svg', { 'data-testid': 'inner-svg', viewBox: '0 0 24 24' }, [h(Probe)]),
    },
  })
  const svg = () => wrapper.find('svg[data-testid="inner-svg"]').element as SVGElement
  function fire(name: string) {
    svg().dispatchEvent(new Event(name))
  }
  return { wrapper, captured, svg, fire }
}

describe('AnimateIcon — hover trigger', () => {
  it('flips current → animate on mouseenter and back on mouseleave', async () => {
    const { wrapper, captured, fire } = mountIcon({ animateOnHover: true })
    expect(captured.ctx!.current.value).toBe('initial')

    fire('mouseenter')
    await flushPromises()
    expect(captured.ctx!.current.value).toBe('animate')

    fire('mouseleave')
    await nextTick()
    expect(captured.ctx!.current.value).toBe('initial')

    wrapper.unmount()
  })

  it('uses the named animation when animateOnHover is a string', async () => {
    const { wrapper, captured, fire } = mountIcon({ animateOnHover: 'fill' })
    fire('mouseenter')
    await flushPromises()
    expect(captured.ctx!.animation.value).toBe('fill')
    wrapper.unmount()
  })
})

describe('AnimateIcon — tap trigger', () => {
  it('flips current on pointerdown / pointerup', async () => {
    const { wrapper, captured, fire } = mountIcon({ animateOnTap: true })
    fire('pointerdown')
    await flushPromises()
    expect(captured.ctx!.current.value).toBe('animate')

    fire('pointerup')
    await nextTick()
    expect(captured.ctx!.current.value).toBe('initial')

    wrapper.unmount()
  })
})

describe('AnimateIcon — animate prop', () => {
  it('starts when toggled true and stops when toggled false', async () => {
    let captured: AnimateIconContext | null = null
    const Probe = defineComponent({
      setup() {
        captured = inject(AnimateIconKey, null)
        return () => null
      },
    })
    const Outer = defineComponent({
      components: { AnimateIcon, Probe },
      props: ['playing'],
      template: `
        <AnimateIcon :animate="playing">
          <svg><Probe /></svg>
        </AnimateIcon>
      `,
    })
    const wrapper = mount(Outer, { props: { playing: false }, attachTo: document.body })
    expect(captured!.current.value).toBe('initial')

    await wrapper.setProps({ playing: true })
    await flushPromises()
    expect(captured!.current.value).toBe('animate')

    await wrapper.setProps({ playing: false })
    await nextTick()
    expect(captured!.current.value).toBe('initial')

    wrapper.unmount()
  })
})

describe('AnimateIcon — persistOnAnimateEnd', () => {
  it('does not reset current when leaving while persist is on', async () => {
    const { wrapper, captured, fire } = mountIcon({
      animateOnHover: true,
      persistOnAnimateEnd: true,
    })
    fire('mouseenter')
    await flushPromises()
    expect(captured.ctx!.current.value).toBe('animate')

    fire('mouseleave')
    await nextTick()
    expect(captured.ctx!.current.value).toBe('animate')

    wrapper.unmount()
  })
})

describe('AnimateIcon — animateOnView', () => {
  it('starts when the in-view ref turns true and stops when it turns false', async () => {
    const { wrapper, captured } = mountIcon({ animateOnView: true })
    expect(captured.ctx!.current.value).toBe('initial')

    inViewRef.value = true
    await flushPromises()
    expect(captured.ctx!.current.value).toBe('animate')

    inViewRef.value = false
    await nextTick()
    expect(captured.ctx!.current.value).toBe('initial')

    wrapper.unmount()
  })

  it('does not start when animateOnView is not set, even if visible', async () => {
    const { wrapper, captured } = mountIcon({})
    inViewRef.value = true
    await flushPromises()
    expect(captured.ctx!.current.value).toBe('initial')
    wrapper.unmount()
  })
})

describe('AnimateIcon — clip', () => {
  it('applies overflow:hidden when clip is true', () => {
    const { wrapper, svg } = mountIcon({ clip: true })
    expect(svg().getAttribute('style') ?? '').toContain('overflow: hidden')
    wrapper.unmount()
  })

  it('omits overflow style when clip is false (default)', () => {
    const { wrapper, svg } = mountIcon({})
    expect(svg().getAttribute('style') ?? '').not.toContain('overflow: hidden')
    wrapper.unmount()
  })
})

describe('AnimateIcon — as="template"', () => {
  it('renders the slot only, no span wrapper', () => {
    const Wrapper = defineComponent({
      components: { AnimateIcon },
      template: `
        <AnimateIcon as="template" v-slot="{ on, viewRef }">
          <button data-testid="custom" :ref="viewRef" v-on="on">x</button>
        </AnimateIcon>
      `,
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    expect(wrapper.find('span').exists()).toBe(false)
    expect(wrapper.find('button[data-testid="custom"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('passing on={...} to a custom element makes that element trigger animations', async () => {
    let captured: AnimateIconContext | null = null
    const Probe = defineComponent({
      setup() {
        captured = inject(AnimateIconKey, null)
        return () => null
      },
    })
    const Wrapper = defineComponent({
      components: { AnimateIcon, Probe },
      template: `
        <AnimateIcon animateOnHover as="template" v-slot="{ on, viewRef }">
          <button data-testid="btn" :ref="viewRef" v-on="on">
            <svg><Probe /></svg>
          </button>
        </AnimateIcon>
      `,
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    const btn = wrapper.find('[data-testid="btn"]').element as HTMLElement
    btn.dispatchEvent(new Event('mouseenter'))
    await flushPromises()
    expect(captured!.current.value).toBe('animate')
    wrapper.unmount()
  })
})

describe('AnimateIcon — ForwardedSlot', () => {
  it('forwards class onto the first slotted element with no wrapper element in the way', () => {
    const { wrapper } = mountIcon({}, { class: 'icon-lg' })
    const svg = wrapper.find('svg[data-testid="inner-svg"]')
    expect(svg.classes()).toContain('icon-lg')
    // No span wrapper should exist anywhere in the rendered tree — the
    // self-wrap span was removed in #5 because it created a layout-breaking
    // line box for absolute-positioned icons.
    expect(wrapper.find('span').exists()).toBe(false)
    wrapper.unmount()
  })

  it('forwards aria-label and id onto the inner element', () => {
    const { wrapper } = mountIcon({}, { 'aria-label': 'heart', id: 'heart-1' })
    const svg = wrapper.find('svg[data-testid="inner-svg"]')
    expect(svg.attributes('aria-label')).toBe('heart')
    expect(svg.attributes('id')).toBe('heart-1')
    wrapper.unmount()
  })

  it('forwards click handlers onto the inner element', async () => {
    const onClick = vi.fn()
    const { wrapper } = mountIcon({}, { onClick })
    await wrapper.find('svg[data-testid="inner-svg"]').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('AnimateIcon — triggerTarget="parent"', () => {
  it('hovering the parent triggers the animation; hovering the icon svg does not', async () => {
    let captured: AnimateIconContext | null = null
    const Probe = defineComponent({
      setup() {
        captured = inject(AnimateIconKey, null)
        return () => null
      },
    })
    const Outer = defineComponent({
      components: { AnimateIcon, Probe },
      template: `
        <button data-testid="outer">
          <AnimateIcon animateOnHover triggerTarget="parent">
            <svg data-testid="inner-svg"><Probe /></svg>
          </AnimateIcon>
        </button>
      `,
    })
    const wrapper = mount(Outer, { attachTo: document.body })
    const button = wrapper.find('[data-testid="outer"]').element as HTMLElement
    const svg = wrapper.find('svg[data-testid="inner-svg"]').element as SVGElement

    // Hovering the icon svg must NOT fire when delegation is active —
    // otherwise nested mouseenter/leave between button → icon would re-reset
    // mid-animation. ForwardedSlot skips its own event handlers when
    // triggerTarget !== 'self'.
    svg.dispatchEvent(new Event('mouseenter'))
    await flushPromises()
    expect(captured!.current.value).toBe('initial')

    button.dispatchEvent(new Event('mouseenter'))
    await flushPromises()
    expect(captured!.current.value).toBe('animate')

    button.dispatchEvent(new Event('mouseleave'))
    await nextTick()
    expect(captured!.current.value).toBe('initial')

    wrapper.unmount()
  })

  it('detaches parent listeners on unmount', () => {
    const Outer = defineComponent({
      components: { AnimateIcon },
      template: `
        <button data-testid="outer">
          <AnimateIcon animateOnHover triggerTarget="parent">
            <svg viewBox="0 0 24 24" />
          </AnimateIcon>
        </button>
      `,
    })
    const wrapper = mount(Outer, { attachTo: document.body })
    const button = wrapper.find('[data-testid="outer"]').element as HTMLElement
    const removeSpy = vi.spyOn(button, 'removeEventListener')
    wrapper.unmount()
    const removed = removeSpy.mock.calls.map(c => c[0])
    expect(removed).toEqual(
      expect.arrayContaining(['mouseenter', 'mouseleave', 'pointerdown', 'pointerup']),
    )
  })

  it('finds the right ancestor when triggerTarget="closest:..." is used', () => {
    const Outer = defineComponent({
      components: { AnimateIcon },
      template: `
        <div data-testid="card">
          <div class="row">
            <AnimateIcon animateOnHover triggerTarget="closest:[data-testid=card]">
              <svg viewBox="0 0 24 24" />
            </AnimateIcon>
          </div>
        </div>
      `,
    })
    const wrapper = mount(Outer, { attachTo: document.body })
    const card = wrapper.find('[data-testid="card"]').element as HTMLElement
    const removeSpy = vi.spyOn(card, 'removeEventListener')
    wrapper.unmount()
    const removed = removeSpy.mock.calls.map(c => c[0])
    expect(removed).toEqual(
      expect.arrayContaining(['mouseenter', 'mouseleave', 'pointerdown', 'pointerup']),
    )
  })
})
