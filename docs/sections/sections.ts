export type DocSection = {
  slug: string
  title: string
  blurb: string
}

export const sections: DocSection[] = [
  { slug: 'quickstart',    title: 'Quickstart',        blurb: 'Install, import, animate.' },
  { slug: 'props',         title: 'Props',             blurb: 'Every prop on every icon, with a live playground.' },
  { slug: 'buttons',       title: 'Icons in buttons',  blurb: 'Make the whole button the trigger.' },
  { slug: 'variants',      title: 'Variants',          blurb: 'Switch between named animations.' },
  { slug: 'color',         title: 'Color',             blurb: 'Drive icon color from the surrounding text color.' },
  { slug: 'programmatic',  title: 'Programmatic',      blurb: 'Trigger animations from your own state.' },
  { slug: 'typescript',    title: 'TypeScript',        blurb: 'Typed props, wrapper helpers, metadata shape.' },
  { slug: 'accessibility', title: 'Accessibility',     blurb: 'Labels, reduced motion, static fallbacks.' },
  { slug: 'agents',        title: 'For AI agents',     blurb: 'llms.txt and copy-pasteable API cheat sheet.' },
]
