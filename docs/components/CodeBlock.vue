<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from './CopyButton.vue'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: 'vue' | 'ts' | 'bash' | 'text'
    copyable?: boolean
  }>(),
  { lang: 'vue', copyable: true },
)

// ---------- tiny syntax tokenizer ----------
//
// Not a real highlighter — just enough to color-cue Vue templates, TS, and
// shell snippets consistently with the existing token CSS (tok-tag, tok-attr,
// tok-string, tok-punct, tok-kw, tok-comment). Built as a scan-and-emit
// pipeline (not regex-chain-replace) so later passes can't match substrings
// inside previously-emitted span attrs. Good enough for a docs page, and
// ships 0kb extra deps.

type Tok = { type: string | null; text: string }

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function emit(toks: Tok[]): string {
  return toks
    .map(t => (t.type ? `<span class="tok-${t.type}">${esc(t.text)}</span>` : esc(t.text)))
    .join('')
}

// ----- Vue template tokenizer -----

const VUE_TAG_RE = /<\/?([A-Za-z][A-Za-z0-9-]*)([^<>]*?)(\/?)>/g
const ATTR_RE = /([@:]?[A-Za-z][A-Za-z0-9-]*)(\s*=\s*)(["'])((?:\\.|(?!\3).)*)\3|([@:]?[A-Za-z][A-Za-z0-9-]*)/g

function tokenizeAttrs(raw: string): Tok[] {
  const out: Tok[] = []
  let last = 0
  let m: RegExpExecArray | null
  ATTR_RE.lastIndex = 0
  while ((m = ATTR_RE.exec(raw))) {
    if (m.index > last) out.push({ type: null, text: raw.slice(last, m.index) })
    if (m[1]) {
      // name = "value"
      out.push({ type: 'attr',   text: m[1] })
      out.push({ type: 'punct',  text: m[2] })
      out.push({ type: 'string', text: `${m[3]}${m[4]}${m[3]}` })
    } else if (m[5]) {
      // bare attr
      out.push({ type: 'attr', text: m[5] })
    }
    last = m.index + m[0].length
  }
  if (last < raw.length) out.push({ type: null, text: raw.slice(last) })
  return out
}

function tokenizeVue(code: string): Tok[] {
  const out: Tok[] = []
  let last = 0
  let m: RegExpExecArray | null
  VUE_TAG_RE.lastIndex = 0
  while ((m = VUE_TAG_RE.exec(code))) {
    if (m.index > last) out.push({ type: null, text: code.slice(last, m.index) })
    const full = m[0]
    const isClose = full.startsWith('</')
    const selfClose = m[3] === '/'
    const tagName = m[1]
    const attrs = m[2]
    out.push({ type: 'punct', text: isClose ? '</' : '<' })
    out.push({ type: 'tag',   text: tagName })
    if (attrs) out.push(...tokenizeAttrs(attrs))
    out.push({ type: 'punct', text: selfClose ? '/>' : '>' })
    last = m.index + full.length
  }
  if (last < code.length) out.push({ type: null, text: code.slice(last) })
  // Decorate HTML comments in the remaining plain-text runs.
  return out.flatMap<Tok>(t => {
    if (t.type !== null) return [t]
    return splitComments(t.text, /<!--[\s\S]*?-->/g, 'comment')
  })
}

// ----- TS tokenizer -----

const TS_KW = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'for', 'while', 'type', 'interface', 'new', 'await', 'async',
  'as', 'default', 'true', 'false', 'null', 'undefined',
])

function tokenizeTs(code: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < code.length) {
    const c = code[i]
    // Line comment
    if (c === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i)
      const stop = end === -1 ? code.length : end
      out.push({ type: 'comment', text: code.slice(i, stop) })
      i = stop
      continue
    }
    // Block comment
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      const stop = end === -1 ? code.length : end + 2
      out.push({ type: 'comment', text: code.slice(i, stop) })
      i = stop
      continue
    }
    // String (", ', `) — simple: no interpolation, handles escapes.
    if (c === '"' || c === "'" || c === '`') {
      const q = c
      let j = i + 1
      while (j < code.length && code[j] !== q) {
        if (code[j] === '\\') j += 2
        else j++
      }
      j = Math.min(j + 1, code.length)
      out.push({ type: 'string', text: code.slice(i, j) })
      i = j
      continue
    }
    // Identifier / keyword
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1
      while (j < code.length && /[A-Za-z0-9_$]/.test(code[j])) j++
      const word = code.slice(i, j)
      out.push({ type: TS_KW.has(word) ? 'kw' : null, text: word })
      i = j
      continue
    }
    // Punctuation cluster (so consecutive punct fuses into one span)
    if (/[{}()[\];,.=<>+\-*/!?:&|]/.test(c)) {
      let j = i
      while (j < code.length && /[{}()[\];,.=<>+\-*/!?:&|]/.test(code[j])) j++
      out.push({ type: 'punct', text: code.slice(i, j) })
      i = j
      continue
    }
    // Passthrough
    let j = i + 1
    while (
      j < code.length &&
      !/[A-Za-z_$"'`{}()[\];,.=<>+\-*/!?:&|]/.test(code[j]) &&
      !(code[j] === '/' && (code[j + 1] === '/' || code[j + 1] === '*'))
    ) {
      j++
    }
    out.push({ type: null, text: code.slice(i, j) })
    i = j
  }
  return out
}

// ----- Bash tokenizer (minimal: $/# prompt + rest) -----

function tokenizeBash(code: string): Tok[] {
  const out: Tok[] = []
  for (const line of code.split('\n')) {
    const m = line.match(/^(\s*)(\$|#)(\s?)(.*)$/)
    if (m) {
      if (m[1]) out.push({ type: null, text: m[1] })
      out.push({ type: 'punct', text: m[2] })
      if (m[3]) out.push({ type: null, text: m[3] })
      if (m[4]) out.push({ type: null, text: m[4] })
    } else {
      out.push({ type: null, text: line })
    }
    out.push({ type: null, text: '\n' })
  }
  if (out.length > 0 && out[out.length - 1].text === '\n') out.pop()
  return out
}

// ----- helpers -----

function splitComments(text: string, re: RegExp, type: string): Tok[] {
  const out: Tok[] = []
  let last = 0
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: null, text: text.slice(last, m.index) })
    out.push({ type, text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ type: null, text: text.slice(last) })
  return out
}

const html = computed(() => {
  const toks =
    props.lang === 'bash' ? tokenizeBash(props.code)
    : props.lang === 'ts' ? tokenizeTs(props.code)
    : props.lang === 'vue' ? tokenizeVue(props.code)
    : [{ type: null, text: props.code }]
  return emit(toks)
})
</script>

<template>
  <div class="code-block">
    <pre><code v-html="html" /></pre>
    <CopyButton v-if="copyable" :text="code" />
  </div>
</template>
