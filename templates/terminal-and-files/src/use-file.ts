import { useEffect, useState } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// The picked file's contents for the file view (FileView.tsx), read again
// when it changes on disk (`fs-changed`, src-tauri/src/tree.rs). A reload
// keeps what was shown until the new contents arrive, and an answer for a
// file no longer picked is dropped. What shows while nothing has come
// back for the picked file -- Loading..., or nothing picked -- is worked
// out as it draws, not set from the effect.

/** Pictures the view shows as pictures. */
export const IMAGE = /\.(png|jpe?g|gif|webp|svg)$/i

export type Content =
  | { kind: 'none' }
  | { kind: 'loading'; path: string }
  | { kind: 'text'; path: string; text: string }
  | { kind: 'image'; path: string; data: Uint8Array }
  | { kind: 'error'; path: string; message: string }

type Loaded = Exclude<Content, { kind: 'none' } | { kind: 'loading' }>

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function useFile(path: string | null): Content {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [rev, setRev] = useState(0)
  useEffect(() => {
    if (!path || !isTauri()) return
    const off = listen<string[]>('fs-changed', (e) => {
      if (e.payload.includes(path)) setRev((r) => r + 1)
    })
    return () => void off.then((f) => f())
  }, [path])
  useEffect(() => {
    if (!path) return
    let live = true
    const load: Promise<Loaded> = !isTauri()
      ? Promise.resolve({ kind: 'error', path, message: 'Files are read in the Thrifty Builder app.' })
      : IMAGE.test(path)
        ? invoke<ArrayBuffer>('read_bytes', { path }).then((b) => ({ kind: 'image', path, data: new Uint8Array(b) }))
        : invoke<string>('read_text', { path }).then((text) => ({ kind: 'text', path, text }))
    load.then(
      (c) => live && setLoaded(c),
      (e) => live && setLoaded({ kind: 'error', path, message: errorText(e) }),
    )
    return () => {
      live = false
    }
  }, [path, rev])
  if (!path) return { kind: 'none' }
  return loaded?.path === path ? loaded : { kind: 'loading', path }
}
