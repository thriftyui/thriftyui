import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Channel, invoke, isTauri } from '@tauri-apps/api/core'
import { FitAddon, Ghostty, Terminal as GhosttyTerminal } from 'ghostty-web'
import wasmUrl from 'ghostty-web/ghostty-vt.wasm?url'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { droppedInside, droppedText } from './dropped-files'
import { listeningOnScreen, modeFromScreen, promptWaiting } from './session-screen'

// The terminal in the right column, where Claude Code runs.
//
// ghostty-web 0.4.0-next.20.g1858a59 (a pinned build;
// github.com/coder/ghostty-web at 1858a59, README, Usage: "API-compatible with
// the xterm.js API") draws what the app runs on a pseudo-terminal: the
// user's shell running claude (src-tauri/src/terminal.rs). Keys go to it by
// `onData`; its output comes back over a Tauri channel, each start with its
// own id, and is written in.
//
// The WebAssembly is loaded from the app's own files (`Ghostty.load` with
// the package's ghostty-vt.wasm, its `?url` import), not by `init()`, which
// fetches a copy written into the script as a data: URL that the app's
// Content-Security-Policy refuses; the policy allows 'wasm-unsafe-eval'
// (tauri-docs, security/csp.mdx).
//
// Built once, and Claude Code started on it, when the app opens -- not when
// its tab first shows -- so the chat works with the terminal never shown;
// again on Enter after it ends, the terminal `reset` before each start but
// the first, so a run leaves nothing behind it. Each start's launch goes to
// `onLaunch`, for the
// chat (use-chat-feed.ts), and null when Claude Code ends.
//
// The chat types into it through its handle, as a person would: `send`
// types a message and then, a
// moment later as a key of its own, Enter (SUBMIT_PAUSE); `key` writes keys
// as they are -- Escape stops Claude; `holdSpace` holds Space down, as a
// held key sends it -- one space, then after the key-repeat delay one every
// repeat interval -- which Claude Code's /voice takes for push-to-talk ("it
// detects a held key by watching for rapid key-repeat events from your
// terminal", voice-dictation.md, Hold to record, read 2026-10-17), never
// longer than HOLD_MAX; `restart` starts Claude Code again; `screen` gives
// the screen's lines.
//
// After output settles (SCREEN_READ), the screen is read for the chat:
// the permission mode on the status bar, whether Claude Code's own prompt
// waits, and whether dictation is listening (session-screen.ts) -- each
// reported on change to `onScreen`.
//
// Files dropped on it while it shows are typed in as their paths
// (dropped-files.ts), as Ghostty does.
//
// Laid out at full size whether its tab shows or not (App.tsx keeps the
// hidden tab laid out, only invisible), so Claude Code always draws for a
// real window. The shell is told a new size only once it has held for
// RESIZE_PAUSE: Claude Code redraws its whole screen on each resize. The
// kit's column collapses to 0 wide
// (kit/src/column.tsx), so the terminal is fitted only to a width that has
// room inside its padding, keeping its last size while collapsed.
//
// The wheel: Claude Code's fullscreen view asks for mouse reports and
// scrolls its conversation itself. ghostty-web turns the wheel into Up and
// Down on the alternate screen (lib/terminal.ts, handleWheel), which Claude
// Code takes as stepping through earlier prompts, and stops the event
// before its own wheel reports (lib/input-handler.ts: SGR
// "\x1b[<Btn;Col;RowM", "button 64 = scroll up, button 65 = scroll down")
// are made. So while the program has asked for mouse tracking in SGR form
// (mode 1006), each wheel step goes to it as that report, at the cell under
// the pointer; a step is WHEEL_STEP pixels, handleWheel's own divisor.
// Otherwise ghostty-web's own handling runs (history on the normal screen).
//
// Its colours are ghostty-web's own: no theme is given, so it draws in its
// DEFAULT_THEME (lib/renderer.ts); the space round it takes that background.
//
// Outside the app (the page alone in a browser) there is no shell, and it
// says so.

/** ghostty-web's default background (lib/renderer.ts, DEFAULT_THEME). */
const BACKGROUND = '#1e1e1e'
const RESIZE_PAUSE = 150
const WHEEL_STEP = 33
/** A message typed from the chat: the words, then Enter as a key press of
 *  its own this long after, not inside the typed text. */
const SUBMIT_PAUSE = 100
/** How often, at most, the screen is read while output arrives. */
const SCREEN_READ = 100
/** A held key's repeat: the delay before it starts, and then its interval
 *  (a choice, not a measured value). */
const REPEAT_DELAY = 250
const REPEAT_EVERY = 33
const HOLD_MAX = 120_000

export interface ScreenState {
  mode: string | null
  prompt: boolean
  listening: 'listening' | 'warming' | null
}

/** The screen's lines, bottom row last. */
function screenLines(t: GhosttyTerminal): string[] {
  const b = t.buffer.active
  const lines: string[] = []
  for (let y = Math.max(0, b.length - t.rows); y < b.length; y++) lines.push(b.getLine(y)?.translateToString(true) ?? '')
  return lines
}

export interface TerminalHandle {
  /** Types `text` and presses Enter; false when nothing is running. */
  send: (text: string) => boolean
  /** Writes keys as they are; false when nothing is running. */
  key: (data: string) => boolean
  /** Holds Space down (true), or lets go (false). */
  holdSpace: (on: boolean) => void
  /** Starts Claude Code again after it has ended. */
  restart: () => void
  /** The screen's lines now, bottom row last. */
  screen: () => string[]
}

let loaded: Promise<Ghostty> | null = null
const loadGhostty = () => (loaded ??= Ghostty.load(wasmUrl))

type TermEvent = { event: 'output'; data: string } | { event: 'exit' }

export function Terminal({
  shown,
  onLaunch,
  onScreen,
  ref,
}: {
  shown: boolean
  onLaunch?: (launch: string | null) => void
  onScreen?: (state: ScreenState) => void
  ref?: Ref<TerminalHandle>
}) {
  const box = useRef<HTMLDivElement>(null)
  const term = useRef<GhosttyTerminal | null>(null)
  const fit = useRef<FitAddon | null>(null)
  const id = useRef<number | null>(null)
  const exited = useRef(false)
  const [runs, setRuns] = useState(0)
  const onLaunchRef = useRef(onLaunch)
  const onScreenRef = useRef(onScreen)
  useEffect(() => {
    onLaunchRef.current = onLaunch
    onScreenRef.current = onScreen
  }, [onLaunch, onScreen])
  // The screen read once output has settled for a moment, told on change.
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const told = useRef('')
  const readScreen = (t: GhosttyTerminal) => {
    if (readTimer.current) return
    readTimer.current = setTimeout(() => {
      readTimer.current = null
      const lines = screenLines(t)
      const state: ScreenState = { mode: modeFromScreen(lines), prompt: promptWaiting(lines), listening: listeningOnScreen(lines) }
      const key = JSON.stringify(state)
      if (key === told.current) return
      told.current = key
      onScreenRef.current?.(state)
    }, SCREEN_READ)
  }
  const held = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (readTimer.current) clearTimeout(readTimer.current)
      if (held.current) clearTimeout(held.current)
    },
    [],
  )
  useImperativeHandle(
    ref,
    () => ({
      send: (text) => {
        const running = id.current
        if (running === null) return false
        invoke('term_write', { id: running, data: text })
          .then(() => new Promise((r) => setTimeout(r, SUBMIT_PAUSE)))
          .then(() => (id.current === running ? invoke('term_write', { id: running, data: '\r' }) : undefined))
          .catch(() => {})
        return true
      },
      key: (data) => {
        if (id.current === null) return false
        invoke('term_write', { id: id.current, data }).catch(() => {})
        return true
      },
      holdSpace: (on) => {
        if (held.current) clearTimeout(held.current)
        held.current = null
        const running = id.current
        if (!on || running === null) return
        const since = performance.now()
        const press = (first: boolean) => {
          if (id.current !== running || performance.now() - since > HOLD_MAX) return void (held.current = null)
          invoke('term_write', { id: running, data: ' ' }).catch(() => {})
          held.current = setTimeout(() => press(false), first ? REPEAT_DELAY : REPEAT_EVERY)
        }
        press(true)
      },
      restart: () => {
        if (exited.current) setRuns((n) => n + 1)
      },
      screen: () => (term.current ? screenLines(term.current) : []),
    }),
    [],
  )
  const shownRef = useRef(shown)
  useEffect(() => {
    shownRef.current = shown
  }, [shown])

  // Build the terminal once, and (re)start Claude Code on it: on first
  // showing, and on each Enter after it ends.
  useEffect(() => {
    if (!box.current) return
    const el = box.current
    let live = true
    ;(async () => {
      const ghostty = await loadGhostty()
      if (!live) return
      if (!term.current) {
        const font = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
        const t = new GhosttyTerminal({
          ghostty,
          fontSize: 12,
          fontFamily: font || "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          cursorBlink: true,
          scrollback: 10000,
        })
        const f = new FitAddon()
        t.loadAddon(f)
        t.open(el)
        f.fit()
        t.onData((data) => {
          if (exited.current) {
            if (data === '\r') setRuns((n) => n + 1)
            return
          }
          if (id.current !== null) invoke('term_write', { id: id.current, data }).catch(() => {})
        })
        let wheelRest = 0
        t.attachCustomWheelEventHandler((e) => {
          if (!t.hasMouseTracking() || !t.getMode(1006)) return false
          if (id.current === null) return true
          wheelRest += e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaY * WHEEL_STEP
          const steps = Math.trunc(wheelRest / WHEEL_STEP)
          if (steps === 0) return true
          wheelRest -= steps * WHEEL_STEP
          const r = (el.querySelector('canvas') ?? el).getBoundingClientRect()
          const col = Math.min(Math.max(Math.floor(((e.clientX - r.left) / r.width) * t.cols) + 1, 1), t.cols)
          const row = Math.min(Math.max(Math.floor(((e.clientY - r.top) / r.height) * t.rows) + 1, 1), t.rows)
          const report = `\x1b[<${steps < 0 ? 64 : 65};${col};${row}M`
          invoke('term_write', { id: id.current, data: report.repeat(Math.abs(steps)) }).catch(() => {})
          return true
        })
        // A column drag resizes the terminal on every pixel; Claude Code
        // redraws its whole screen on each resize, so only the size it
        // settles at is sent.
        let pending: ReturnType<typeof setTimeout> | null = null
        t.onResize(({ cols, rows }) => {
          if (pending) clearTimeout(pending)
          pending = setTimeout(() => {
            pending = null
            if (id.current !== null) invoke('term_resize', { id: id.current, cols, rows }).catch(() => {})
          }, RESIZE_PAUSE)
        })
        term.current = t
        fit.current = f
      } else {
        term.current.reset()
      }
      const t = term.current
      if (!isTauri()) {
        t.write('No shell here: the terminal runs in the desktop app.\r\n')
        return
      }
      const channel = new Channel<TermEvent>()
      const run = { id: null as number | null }
      channel.onmessage = (m) => {
        if (!live || run.id !== id.current) return
        if (m.event === 'output') {
          t.write(m.data)
          readScreen(t)
        } else {
          id.current = null
          exited.current = true
          onLaunchRef.current?.(null)
          told.current = ''
          onScreenRef.current?.({ mode: null, prompt: false, listening: null })
          t.write('\r\n\x1b[2m[Claude Code exited. Press Enter to start it again.]\x1b[0m\r\n')
        }
      }
      exited.current = false
      const started = await invoke<{ id: number; launch: string }>('term_start', { cols: t.cols, rows: t.rows, onEvent: channel })
      run.id = started.id
      if (!live) return
      id.current = run.id
      onLaunchRef.current?.(started.launch)
      if (shownRef.current) t.focus()
    })()
    return () => {
      live = false
    }
  }, [runs])

  // Its size follows the column's -- FitAddon's own fitting, but never to a
  // collapsed column (above).
  useEffect(() => {
    const el = box.current
    if (!el) return
    let pause: ReturnType<typeof setTimeout> | null = null
    const sized = new ResizeObserver(() => {
      if (pause) clearTimeout(pause)
      pause = setTimeout(() => {
        const pad = getComputedStyle(el)
        const inner = el.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight)
        if (inner > 0 && el.clientHeight > 0) fit.current?.fit()
      }, RESIZE_PAUSE)
    })
    sized.observe(el)
    return () => {
      sized.disconnect()
      if (pause) clearTimeout(pause)
    }
  }, [])

  // Files dropped on it while it shows: their paths typed in. The window
  // gets the drop, with the paths, from Tauri's drag-and-drop event (a page
  // alone never sees a file's path), so it is listened for there.
  useEffect(() => {
    if (!isTauri()) return
    let off: (() => void) | null = null
    let live = true
    getCurrentWebview()
      .onDragDropEvent((e) => {
        if (e.payload.type !== 'drop' || !shownRef.current || id.current === null || !box.current) return
        if (!droppedInside(e.payload.position, box.current.getBoundingClientRect())) return
        const text = droppedText(e.payload.paths)
        if (!text) return
        invoke('term_write', { id: id.current, data: text }).catch(() => {})
        term.current?.focus()
      })
      .then((unlisten) => (live ? (off = unlisten) : unlisten()))
      .catch(() => {})
    return () => {
      live = false
      off?.()
    }
  }, [])

  // Shown: fit to its size, and focus.
  useEffect(() => {
    if (!shown || !term.current) return
    const r = requestAnimationFrame(() => {
      fit.current?.fit()
      term.current?.focus()
    })
    return () => cancelAnimationFrame(r)
  }, [shown])

  // Gone (the app closing): stop the shell and free the terminal.
  useEffect(
    () => () => {
      if (isTauri()) invoke('term_stop').catch(() => {})
      fit.current?.dispose()
      term.current?.dispose()
      term.current = null
      fit.current = null
    },
    [],
  )

  return (
    <div className="relative flex h-full w-full flex-col" style={{ background: BACKGROUND }}>
      <div ref={box} aria-label="Terminal" role="group" className="min-h-0 flex-1 overflow-hidden px-2 pt-2" />
    </div>
  )
}
