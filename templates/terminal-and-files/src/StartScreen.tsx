import { useEffect, useState, type CSSProperties } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { FolderPlus, X } from 'lucide-react'
import { Button } from 'thriftyui/button'
import { CELL, CELL_ICON } from 'thriftyui/cell'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'thriftyui/dialog'
import { Input } from 'thriftyui/input'
import { Label } from 'thriftyui/label'
import { ScrollArea } from 'thriftyui/scroll-area'

// The window before a project is open: Thrifty Builder's start screen
// (ThriftyUI's repository: builder/src/StartScreen.tsx) without its
// templates: the name, a line, New project, and the recent projects in a box
// that scrolls past RECENT_SHOWN of them. The whole window, no columns and no
// bar, since Settings and Claude belong to an open project.
//
// New project opens the kit's Dialog: its name, and where it goes
// (Change... opens the Mac's folder picker). What it makes -- a blank
// folder, nothing in it: src-tauri/src/folder.rs, create_blank. Change...
// is the kit's button with an edge and the page's ground, as Builder's is.
//
// The page's main content, its name the page's one heading (axe-core,
// landmark-one-main and page-has-heading-one).

const OUTLINE = 'border border-neutral-6 bg-neutral-1 font-semibold text-neutral-12'

/** A recent row's height and the gap under it, in pixels, and how many
 *  show before the box scrolls. */
const ROW_STEP = 52
const GAP = 4
const RECENT_SHOWN = 6

const nameOf = (path: string) => path.split('/').filter(Boolean).pop() ?? path

export function StartScreen({
  recent,
  opening,
  error,
  onOpen,
  onCreate,
}: {
  recent: string[]
  opening: boolean
  error: string | null
  onOpen: (path: string) => void
  /** Makes and opens a project; true when it was made. */
  onCreate: (parent: string, name: string) => Promise<boolean>
}) {
  const [making, setMaking] = useState(false)
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  useEffect(() => {
    if (making && !parent && isTauri()) invoke<string>('default_parent').then(setParent, () => {})
  }, [making, parent])
  const pickParent = async () => {
    if (!isTauri()) return
    const p = await openDialog({ directory: true, multiple: false, defaultPath: parent || undefined }).catch(() => null)
    if (typeof p === 'string') setParent(p)
  }
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-neutral-1 p-6 text-neutral-12">
      <h1 className="text-xl font-bold">Terminal and files</h1>
      <p className="max-w-xs text-center text-xs text-neutral-11">Start a new project, or open one you have.</p>
      <Dialog open={making} onOpenChange={setMaking}>
        <Button variant="solid" onClick={() => setMaking(true)} disabled={opening}>
          <FolderPlus aria-hidden />
          New project
        </Button>
        <DialogContent>
          <form
            aria-label="New project"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim() && parent) void onCreate(parent, name.trim()).then((made) => made && setMaking(false))
            }}
          >
            <DialogHeader>
              <DialogTitle>
                <span className="pattern-text">New project</span>
              </DialogTitle>
              <DialogClose aria-label="Close" className={CELL}>
                <X aria-hidden className={CELL_ICON} />
              </DialogClose>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-project-name" className="text-xs">
                  Name
                </Label>
                <Input id="new-project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-project" autoFocus />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium">Where</span>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-neutral-11" title={parent}>
                    {parent || '…'}
                  </span>
                  <Button type="button" onClick={() => void pickParent()} className={OUTLINE}>
                    Change…
                  </Button>
                </div>
              </div>
              {error && making && (
                <p role="alert" className="text-[11px] text-danger-11">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter className="items-center justify-end gap-2 px-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="solid" disabled={opening || !name.trim() || !parent}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {error && !making && (
        <p role="alert" className="max-w-xs text-center text-[11px] text-danger-11">
          {error}
        </p>
      )}
      {recent.length > 0 && (
        <section aria-labelledby="recent-projects" className="flex w-full max-w-sm flex-col gap-1 pt-2">
          <p id="recent-projects" className="text-[10px] font-semibold tracking-wide text-neutral-11 uppercase">
            Recent
          </p>
          {/* Its height: the rows shown, at most RECENT_SHOWN; past that it
              scrolls. Its rows are buttons, so the box is no tab stop of
              its own (kit/src/scroll-area.tsx, viewportTabIndex). */}
          <ScrollArea aria-labelledby="recent-projects" viewportTabIndex={-1} style={{ height: Math.min(recent.length, RECENT_SHOWN) * ROW_STEP - GAP }}>
            <ul className="flex flex-col gap-1">
              {recent.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    disabled={opening}
                    onClick={() => onOpen(p)}
                    className="h-(--recent-row) w-full rounded-md border border-neutral-6 px-3 text-left transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                    style={{ '--recent-row': `${ROW_STEP - GAP}px` } as CSSProperties}
                  >
                    <span className="block truncate text-xs text-neutral-12">{nameOf(p)}</span>
                    <span className="block truncate text-[10px] text-neutral-11">{p}</span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </section>
      )}
    </main>
  )
}
