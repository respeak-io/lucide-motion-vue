// happy-dom doesn't ship IntersectionObserver. motion-v's `useInView` (used
// inside AnimateIcon for `animateOnView`) calls `new IntersectionObserver`
// on mount, so without this stub every component test that mounts the wrapper
// would throw. Tests that exercise `animateOnView` install their own
// observable stub on top of this; the default just needs to not blow up.
class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds = []
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  // Stub doesn't need to match the full lib.dom signature.
  ;(globalThis as any).IntersectionObserver = StubIntersectionObserver
}

// Some animations call requestAnimationFrame in `start()`. happy-dom provides
// it, but with a 16ms-ish delay; collapse it to a microtask so tests don't
// have to add real timeouts to observe variant flips.
if (typeof globalThis.requestAnimationFrame !== 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    queueMicrotask(() => cb(performance.now()))
    return 0
  }
}
