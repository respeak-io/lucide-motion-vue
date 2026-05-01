import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import {
  AnimateIconKey,
  MultiVariantIcon,
  type AnimateIconContext,
  type MultiVariantAnimations,
  type VariantName,
} from '@respeak/lucide-motion-vue'

/**
 * <MultiVariantIcon> is the runtime piece that lifts the "variants must
 * share one element graph" limitation. The consumer-facing API stays the
 * same — `<Bell animation="alt" />` — but the silhouette of `default` and
 * `alt` no longer has to match.
 *
 * These tests cover that contract directly: render the component, flip the
 * active animation via the AnimateIcon context, and check that the SVG's
 * element list switches accordingly.
 */
describe('<MultiVariantIcon>', () => {
  const animations: MultiVariantAnimations = {
    default: {
      elements: [
        {
          tag: 'circle',
          attrs: { cx: 12, cy: 12, r: 6 },
          key: 'circle',
        },
      ],
      variants: {
        circle: { initial: { scale: 1 }, animate: { scale: 1.2 } },
      },
    },
    alt: {
      elements: [
        {
          tag: 'rect',
          attrs: { x: 4, y: 4, width: 16, height: 16 },
          key: 'box',
        },
        {
          tag: 'line',
          attrs: { x1: 4, y1: 4, x2: 20, y2: 20 },
          key: 'slash',
        },
      ],
      variants: {
        box: { initial: { rotate: 0 }, animate: { rotate: 45 } },
        slash: { initial: { pathLength: 0 }, animate: { pathLength: 1 } },
      },
    },
  }

  /**
   * Build a host component that provides the AnimateIcon context and lets
   * the test drive the active animation directly. Mirrors how AnimateIcon
   * sets things up at runtime, minus the trigger-handling layer.
   */
  function makeHost(initialAnimation: string) {
    const animation = ref(initialAnimation)
    const current: Ref<VariantName> = ref('initial')
    const ctx: AnimateIconContext = {
      current,
      animation,
      notifyComplete: () => {},
    }
    const Host = defineComponent({
      setup() {
        provide(AnimateIconKey, ctx)
        return () => h(MultiVariantIcon, { animations, size: 24 })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    return { wrapper, animation }
  }

  it('renders the default animation when the consumer omits `animation`', () => {
    const { wrapper } = makeHost('default')
    expect(wrapper.find('circle').exists()).toBe(true)
    expect(wrapper.find('rect').exists()).toBe(false)
    expect(wrapper.find('line').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders the alt animation when `animation="alt"` is active', () => {
    const { wrapper } = makeHost('alt')
    expect(wrapper.find('rect').exists()).toBe(true)
    expect(wrapper.find('line').exists()).toBe(true)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('swaps the element graph when the active animation changes', async () => {
    const { wrapper, animation } = makeHost('default')
    expect(wrapper.find('circle').exists()).toBe(true)
    expect(wrapper.find('rect').exists()).toBe(false)

    animation.value = 'alt'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('circle').exists()).toBe(false)
    expect(wrapper.find('rect').exists()).toBe(true)
    expect(wrapper.find('line').exists()).toBe(true)

    wrapper.unmount()
  })

  it('falls back to default when an unknown animation name is requested', () => {
    const { wrapper } = makeHost('does-not-exist')
    // Should land on the `default` shape rather than blowing up.
    expect(wrapper.find('circle').exists()).toBe(true)
    expect(wrapper.find('rect').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders an SVG with a 0 0 24 24 viewBox', () => {
    const { wrapper } = makeHost('default')
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    wrapper.unmount()
  })
})
