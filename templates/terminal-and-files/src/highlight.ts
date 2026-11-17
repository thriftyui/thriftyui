import { createHighlighterCore, type HighlighterCore, type ThemedToken } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

// A file's text coloured by its language, for the file view (FileView.tsx):
// Shiki (4.5.0) with GitHub's dark theme.
// Shiki's core with its JavaScript engine (shiki/engine/javascript,
// "JavaScript's native RegExp" -- @shikijs/engine-javascript's README), each
// language loaded the first time a file needs it (`shiki/langs/<name>.mjs`;
// createHighlighterCore, @shikijs/core's types). A file of no language here,
// or over MAX_CHARS, stays plain. Its comments' grey swapped for one that
// reads on the view's dark ground, as the site's code (web/code-plugin.ts,
// COMMENT, says why).

export type Token = ThemedToken

const MAX_CHARS = 500_000

// Which language a file is coloured as: a table by extension and, for
// a few files with none, by name.
const BY_EXT: Record<string, string> = {
  rs: 'rust', ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  json: 'json', jsonc: 'jsonc', toml: 'toml', md: 'markdown', css: 'css', html: 'html',
  yaml: 'yaml', yml: 'yaml', py: 'python', sh: 'shellscript', bash: 'shellscript', zsh: 'shellscript',
  lean: 'lean', tex: 'latex', sty: 'latex', cls: 'latex', bib: 'bibtex', typ: 'typst',
  swift: 'swift', zig: 'zig', sql: 'sql', diff: 'diff', patch: 'diff', ini: 'ini',
  xml: 'xml', svg: 'xml', nix: 'nix',
}
const BY_NAME: Record<string, string> = { 'Cargo.lock': 'toml', Makefile: 'make', '.gitignore': 'ini' }

// Each language's grammar, loaded the first time a file needs it. Written
// out, as a bundler finds only imports it can see.
const LOADERS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsonc: () => import('shiki/langs/jsonc.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  lean: () => import('shiki/langs/lean.mjs'),
  latex: () => import('shiki/langs/latex.mjs'),
  bibtex: () => import('shiki/langs/bibtex.mjs'),
  typst: () => import('shiki/langs/typst.mjs'),
  swift: () => import('shiki/langs/swift.mjs'),
  zig: () => import('shiki/langs/zig.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  ini: () => import('shiki/langs/ini.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
  nix: () => import('shiki/langs/nix.mjs'),
  make: () => import('shiki/langs/make.mjs'),
}

let highlighter: Promise<HighlighterCore> | null = null

const getHighlighter = () =>
  (highlighter ??= createHighlighterCore({ themes: [import('shiki/themes/github-dark.mjs')], langs: [], engine: createJavaScriptRegexEngine() }))

async function load(h: HighlighterCore, lang: string) {
  if (!h.getLoadedLanguages().includes(lang)) await h.loadLanguage((await LOADERS[lang]()) as never)
}

export function langOf(path: string): string | null {
  const name = path.split('/').pop() ?? ''
  if (BY_NAME[name]) return BY_NAME[name]
  const dot = name.lastIndexOf('.')
  return dot > 0 ? (BY_EXT[name.slice(dot + 1).toLowerCase()] ?? null) : null
}

// A language's patterns are made ready the first time they colour
// anything: in Chrome, 150 to 300ms for a first TypeScript file, near
// nothing after. A short sample of each common language, coloured in the
// background, pays that before a file is picked.
const SAMPLES: Record<string, string> = {
  tsx: `import { useState, type ReactNode } from 'react'
// A comment
export function Card({ title, children }: { title: string; children?: ReactNode }) {
  const [open, setOpen] = useState<boolean>(false)
  return <section className={\`card \${open ? 'open' : ''}\`} onClick={() => setOpen(!open)}>{title}{children}</section>
}
export default Card`,
  typescript: `export type Item = { id: number; name?: string }
/** Doc */
export const items: Item[] = [{ id: 1, name: 'one' }].filter((i) => i.id > 0)
export async function get(url: string): Promise<Item[]> { return (await fetch(url)).json() as Promise<Item[]> }`,
  css: `@import "tailwindcss";
:root { --page: #fff; }
.card:hover > a::after { color: var(--page); margin: 0 auto; transition: color 150ms ease; }
@media (width < 64rem) { .card { display: grid; } }`,
  json: `{ "name": "app", "version": "0.1.0", "private": true, "scripts": { "dev": "vite" }, "list": [1, 2.5, null, false] }`,
  markdown: `# Title

Some *text*, **bold**, \`code\` and a [link](https://example.com).

- A list
1. A step

> A quote`,
}

let prepared = false

/** Gets the common languages ready in the background, one at a time while
 *  the page is idle, so the first file of each is coloured at once. */
export function prepare() {
  if (prepared || typeof window === 'undefined') return
  prepared = true
  const idle = (run: () => void) => (window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 2000 }) : setTimeout(run, 50))
  const langs = Object.keys(SAMPLES)
  const next = (i: number) =>
    i < langs.length &&
    idle(() => {
      void getHighlighter()
        .then(async (h) => {
          await load(h, langs[i])
          h.codeToTokensBase(SAMPLES[langs[i]], { lang: langs[i], theme: 'github-dark' })
        })
        .catch(() => {})
        .finally(() => next(i + 1))
    })
  next(0)
}

/** The text's lines as tokens, or null for text that stays plain. */
export async function highlight(text: string, path: string): Promise<Token[][] | null> {
  const lang = langOf(path)
  if (!lang || text.length > MAX_CHARS) return null
  const h = await getHighlighter()
  await load(h, lang)
  return h.codeToTokensBase(text, { lang, theme: 'github-dark', colorReplacements: { '#6a737d': '#b4b4b4' } })
}
