export type DocSection = {
  slug: string
  title: string
  blurb: string
}

export const sections: DocSection[] = [
  { slug: 'quickstart',   title: 'Quickstart',   blurb: 'Install, import, animate.' },
  { slug: 'buttons',      title: 'Icons in buttons', blurb: 'Make the whole button the trigger.' },
  { slug: 'variants',     title: 'Variants',     blurb: 'Switch between named animations.' },
  { slug: 'color',        title: 'Color',        blurb: 'Drive icon color from the surrounding text color.' },
  { slug: 'programmatic', title: 'Programmatic', blurb: 'Trigger animations from your own state.' },
  { slug: 'agents',       title: 'For AI agents', blurb: 'llms.txt and copy-pasteable API cheat sheet.' },
]
