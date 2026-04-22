import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Tiny hash router. No vue-router dep. Top-level routes:
 *
 *   #/                      → browse (icon grid, search, detail drawer)
 *   #/docs                  → docs (intro page)
 *   #/docs/<section>        → docs with a specific section scrolled into view
 *   #/playground            → playground (icon picker + prop controls)
 *   #/playground/<kebab>    → playground with a specific icon preselected
 *
 * The docs view watches `route.section` and jumps to the anchor when it
 * changes. The playground treats `section` as the icon's kebab-case slug.
 */

export type Route = {
  view: 'browse' | 'docs' | 'playground'
  section: string | null
}

function parse(hash: string): Route {
  // Strip leading #, leading /, trailing /
  const h = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (!h) return { view: 'browse', section: null }
  const [head, ...rest] = h.split('/')
  if (head === 'docs') {
    return { view: 'docs', section: rest[0] ?? null }
  }
  if (head === 'playground') {
    return { view: 'playground', section: rest[0] ?? null }
  }
  return { view: 'browse', section: null }
}

function stringify(r: Route): string {
  if (r.view === 'browse') return '#/'
  if (r.view === 'playground') {
    return r.section ? `#/playground/${r.section}` : '#/playground'
  }
  if (r.section) return `#/docs/${r.section}`
  return '#/docs'
}

export function useRouter() {
  const route = ref<Route>(parse(window.location.hash))

  function sync() {
    route.value = parse(window.location.hash)
  }

  function push(next: Route) {
    const target = stringify(next)
    if (window.location.hash === target) {
      // Force reactive update even when hash doesn't change (e.g. re-click same nav item)
      sync()
      return
    }
    window.location.hash = target
    // The browser fires `hashchange` asynchronously, which would leave the
    // UI out of sync with the URL for a tick. Sync eagerly so consumers
    // observing the route ref react in the same microtask as the click.
    route.value = parse(target)
  }

  onMounted(() => window.addEventListener('hashchange', sync))
  onBeforeUnmount(() => window.removeEventListener('hashchange', sync))

  return { route, push }
}
