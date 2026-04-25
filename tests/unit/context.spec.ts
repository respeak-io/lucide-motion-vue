import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide, ref } from 'vue'
import { mount } from '@vue/test-utils'
import {
  AnimateIconKey,
  getVariants,
  hasOwnTriggers,
  useAnimateIconContext,
  type AnimateIconContext,
  type VariantName,
} from '../../src/core/context'

function makeProvider(ctx: AnimateIconContext, child: ReturnType<typeof defineComponent>) {
  return defineComponent({
    setup() {
      provide(AnimateIconKey, ctx)
      return () => h(child)
    },
  })
}

describe('hasOwnTriggers', () => {
  it('is false when no triggers are set', () => {
    expect(hasOwnTriggers({})).toBe(false)
    expect(hasOwnTriggers({ animate: false })).toBe(false)
    expect(hasOwnTriggers({ animateOnHover: false })).toBe(false)
  })

  it('is true when any trigger is set', () => {
    expect(hasOwnTriggers({ animate: true })).toBe(true)
    expect(hasOwnTriggers({ animate: 'fill' })).toBe(true)
    expect(hasOwnTriggers({ animateOnHover: true })).toBe(true)
    expect(hasOwnTriggers({ animateOnTap: true })).toBe(true)
    expect(hasOwnTriggers({ animateOnView: true })).toBe(true)
  })
})

describe('useAnimateIconContext', () => {
  it('returns a default standalone context when no provider is mounted', () => {
    let ctx: AnimateIconContext | null = null
    const Probe = defineComponent({
      setup() {
        ctx = useAnimateIconContext()
        return () => null
      },
    })
    mount(Probe)
    expect(ctx!.current.value).toBe('initial')
    expect(ctx!.animation.value).toBe('default')
    expect(() => ctx!.notifyComplete()).not.toThrow()
  })

  it('returns the provided context when one is supplied', () => {
    let ctx: AnimateIconContext | null = null
    const provided: AnimateIconContext = {
      current: ref<VariantName>('animate'),
      animation: ref('fill'),
      notifyComplete: () => {},
    }
    const Probe = defineComponent({
      setup() {
        ctx = useAnimateIconContext()
        return () => null
      },
    })
    mount(makeProvider(provided, Probe))
    expect(ctx!.animation.value).toBe('fill')
    expect(ctx!.current.value).toBe('animate')
  })
})

describe('getVariants', () => {
  it('returns the active animation group based on the context animation name', () => {
    let variantsRef: ReturnType<typeof getVariants> | null = null
    const animations = {
      default: { path: { initial: { x: 0 }, animate: { x: 1 } } },
      fill: { path: { initial: { x: 0 }, animate: { x: 2 } } },
    }
    const provided: AnimateIconContext = {
      current: ref<VariantName>('initial'),
      animation: ref('fill'),
      notifyComplete: () => {},
    }
    const Probe = defineComponent({
      setup() {
        variantsRef = getVariants(animations)
        return () => null
      },
    })
    mount(makeProvider(provided, Probe))
    expect(variantsRef!.value.path.animate.x).toBe(2)
  })

  it('falls back to `default` when the named animation is missing', () => {
    let variantsRef: ReturnType<typeof getVariants> | null = null
    const animations = {
      default: { path: { initial: { x: 0 }, animate: { x: 1 } } },
    }
    const provided: AnimateIconContext = {
      current: ref<VariantName>('initial'),
      animation: ref('does-not-exist'),
      notifyComplete: () => {},
    }
    const Probe = defineComponent({
      setup() {
        variantsRef = getVariants(animations)
        return () => null
      },
    })
    mount(makeProvider(provided, Probe))
    expect(variantsRef!.value.path.animate.x).toBe(1)
  })

  it('reacts to animation changes after mount', async () => {
    let variantsRef: ReturnType<typeof getVariants> | null = null
    const animations = {
      default: { path: { initial: { x: 0 }, animate: { x: 1 } } },
      fill: { path: { initial: { x: 0 }, animate: { x: 9 } } },
    }
    const animation = ref('default')
    const provided: AnimateIconContext = {
      current: ref<VariantName>('initial'),
      animation,
      notifyComplete: () => {},
    }
    const Probe = defineComponent({
      setup() {
        variantsRef = getVariants(animations)
        return () => null
      },
    })
    mount(makeProvider(provided, Probe))
    expect(variantsRef!.value.path.animate.x).toBe(1)
    animation.value = 'fill'
    expect(variantsRef!.value.path.animate.x).toBe(9)
  })
})
