import { useEffect, useMemo, useState } from 'react'
import { cn } from 'thriftyui/cn'
import { highlight, langOf, prepare, type Token } from './highlight'
import type { Content } from './use-file'
import type { FileViewState } from './use-file-view'

// The picked file in the page, read only. Its header: the file's path, and
// READ ONLY. Every file is shown as it is, as an editor shows it; Markdown
// too, its lines coloured as code. Its body, by the file:
//   text       the lines, numbered, coloured by language (highlight.ts):
//              shown once coloured, or plain if that takes over WAIT ms; a tab
//              stop, so the keyboard can scroll it (axe-core,
//              scrollable-region-focusable). Dark always, as the site's
//              code is (web/src/docs/Code.tsx: the kit's `dark` class on
//              the block, on the neutral's step 1).
//   picture    the picture at its own size or smaller, never enlarged, over
//              a checkerboard so a clear area reads as clear; under it its
//              name, its pixel size and its file size
//   notice     Loading..., or why it cannot be shown
//   none yet   what the page shows and which files it reads, from what
//              this file, use-
//              file.ts (IMAGE), highlight.ts (LANGS) and src-tauri/src/
//              files.rs (MAX_TEXT_BYTES, UTF-8) handle
// Nothing here edits; Claude writes the files.

const NOTE = 'm-auto px-6 text-center text-xs tracking-wide text-neutral-11 uppercase'

type View = FileViewState

export function FileViewHeader({ view }: { view: View }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
      <span className="min-w-0 flex-1 truncate py-1 font-mono text-[11px] text-neutral-12" title={view.path ?? undefined}>
        <span className="pattern-text">{view.path ?? 'No file selected'}</span>
      </span>
      <span className="pattern-text shrink-0 text-[10px] tracking-wide text-neutral-11 uppercase">Read only</span>
    </div>
  )
}

export function FileViewBody({ view }: { view: View }) {
  const { content } = view
  useEffect(prepare, [])
  if (content.kind === 'none') return <NoFile />
  if (content.kind === 'loading') return <div className={NOTE}>Loading…</div>
  if (content.kind === 'error') return <div className="m-auto max-w-md px-6 text-center text-xs text-neutral-11">{content.message}</div>
  if (content.kind === 'image') return <Picture content={content} />
  return <Code path={content.path} text={content.text} />
}

/** The page before a file is picked: what it shows, and which files. */
function NoFile() {
  return (
    <div className="m-auto flex max-w-sm flex-col gap-3 px-6 py-8 text-xs text-neutral-11">
      <p className="text-sm font-medium text-neutral-12">Pick a file on the left to see it here.</p>
      <p>Files are shown as they are, read only: Claude writes them.</p>
      <ul className="flex flex-col gap-2">
        <li>
          <span className="font-medium text-neutral-12">Code</span>: its lines numbered and coloured by language -- TypeScript,
          JavaScript, Rust, Python, JSON, CSS, HTML, Markdown, Swift, SQL, shell scripts and more.
        </li>
        <li>
          <span className="font-medium text-neutral-12">Pictures</span>: PNG, JPEG, GIF, WebP and SVG.
        </li>
        <li>
          <span className="font-medium text-neutral-12">Any other text file</span>: its lines, up to 2 MB.
        </li>
      </ul>
    </div>
  )
}

/** How long a file may wait for its colours before it shows plain, in ms. */
const WAIT = 200

function Code({ path, text }: { path: string; text: string }) {
  const lines = useMemo(() => text.split('\n'), [text])
  // Colour for this exact text, or plain while it is made.
  const [coloured, setColoured] = useState<{ text: string; lines: Token[][] } | null>(null)
  useEffect(() => {
    if (!langOf(path)) return
    let live = true
    highlight(text, path).then(
      (t) => live && t && setColoured({ text, lines: t }),
      () => {},
    )
    return () => {
      live = false
    }
  }, [path, text])
  // Plain only if colouring is slow, so a file does not flash from plain
  // to coloured as it opens.
  const [waited, setWaited] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setWaited(text), WAIT)
    return () => clearTimeout(t)
  }, [text])
  const tokens = coloured?.text === text ? coloured.lines : null
  const shown = tokens || !langOf(path) || waited === text
  return (
    <div
      tabIndex={0}
      aria-label={path}
      className="dark min-h-0 flex-1 overflow-auto bg-neutral-1 text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <pre className={cn('min-w-max py-2 font-mono text-[12px] leading-5', !shown && 'invisible')}>
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span aria-hidden className="w-12 shrink-0 pr-3 text-right text-neutral-11 select-none">
              {i + 1}
            </span>
            <code className="pr-4 whitespace-pre">
              {tokens?.[i]
                ? tokens[i].map((t, k) => (
                    <span key={k} style={{ color: t.color, fontStyle: t.fontStyle === 1 ? 'italic' : undefined }}>
                      {t.content}
                    </span>
                  ))
                : line}
            </code>
          </div>
        ))}
      </pre>
    </div>
  )
}

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }

const sizeText = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

function Picture({ content }: { content: Extract<Content, { kind: 'image' }> }) {
  const name = content.path.split('/').pop() ?? content.path
  const type = TYPES[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
  // A data: address, which needs nothing let go afterwards; the app's
  // Content-Security-Policy allows data: for pictures (tauri.conf.json).
  const url = useMemo(() => {
    let bin = ''
    for (let i = 0; i < content.data.length; i += 0x8000) bin += String.fromCharCode(...content.data.subarray(i, i + 0x8000))
    return `data:${type};base64,${btoa(bin)}`
  }, [content.data, type])
  const [natural, setNatural] = useState<{ url: string; w: number; h: number } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
        style={{ backgroundImage: 'repeating-conic-gradient(var(--neutral-3) 0 25%, transparent 0 50%)', backgroundSize: '16px 16px' }}
      >
        {failed === url ? (
          <div className={NOTE}>Could not show this picture</div>
        ) : (
          <img
            src={url}
            alt={name}
            className="max-h-full max-w-full object-contain"
            onLoad={(e) => setNatural({ url, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onError={() => setFailed(url)}
          />
        )}
      </div>
      <div className="flex h-8 shrink-0 items-center gap-3 border-t border-neutral-6 px-3 text-[10px] text-neutral-11 tabular-nums">
        <span className="min-w-0 flex-1 truncate font-mono">{name}</span>
        {natural?.url === url && <span>{`${natural.w} × ${natural.h}`}</span>}
        <span>{sizeText(content.data.byteLength)}</span>
      </div>
    </div>
  )
}
