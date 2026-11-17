import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { Column, ColumnClose, ColumnContent, ColumnFooter, ColumnHeader, ColumnProvider, ColumnTrigger } from 'thriftyui/column'
import { ColumnDrawer, ColumnDrawerTrigger } from 'thriftyui/column-drawer'
import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { SkipLink } from 'thriftyui/skip-link'
import { FileTree } from './FileTree'
import { useSettings, type Settings } from './settings'
import { SettingsDrawer } from './SettingsDrawer'
import { StartScreen } from './StartScreen'
import { FileViewBody, FileViewHeader } from './FileView'
import { ICON_CELL } from './header'
import { useFileView } from './use-file-view'
import { Terminal } from './Terminal'
import { useTree } from './use-tree'

// Terminal and files' window, as Thrifty Builder's is: the open project's files
// on the left, the file picked in the page, and Claude Code in its
// terminal on the right. Each column has a header and a footer; Settings
// rise from the left column's foot, in its drawer. A desktop app, so no
// phone layout: the window is never narrower than the kit's wide layout
// (1024px, src-tauri/tauri.conf.json minWidth), and there is no bottom bar.
//
// Before a project is open, the window is the start screen
// (StartScreen.tsx); opening or making one shows it here, and Claude Code
// starts in its folder (src-tauri/src/folder.rs). Close project, in
// Settings, goes back -- Thrifty Builder's way
// (ThriftyUI's repository: builder/src/App.tsx).

/** How narrow and how wide each column may be dragged, in px. */
const COLUMN_MIN = { left: 208, right: 280 }
const COLUMN_MAX = { left: 280, right: 384 }

interface FolderInfo {
  root: string
  name: string
  recent: string[]
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function App() {
  const [settings, changeSettings] = useSettings()
  const [folder, setFolder] = useState<FolderInfo | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isTauri()) invoke<string[]>('recent_folders').then(setRecent, () => {})
  }, [])

  const open = useCallback(async (path: string) => {
    setOpening(true)
    setError(null)
    try {
      const f = await invoke<FolderInfo>('open_folder', { path })
      setFolder(f)
      setRecent(f.recent)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setOpening(false)
    }
  }, [])
  const create = useCallback(async (parent: string, name: string) => {
    if (!isTauri()) {
      setError('Making a project needs the desktop app.')
      return false
    }
    setOpening(true)
    setError(null)
    try {
      const f = await invoke<FolderInfo>('new_project', { parent, name })
      setFolder(f)
      setRecent(f.recent)
      return true
    } catch (e) {
      setError(errorText(e))
      return false
    } finally {
      setOpening(false)
    }
  }, [])
  const close = useCallback(() => {
    if (isTauri()) invoke('close_folder').catch(() => {})
    setFolder(null)
    if (isTauri()) invoke<string[]>('recent_folders').then(setRecent, () => {})
  }, [])

  if (!folder) return <StartScreen recent={recent} opening={opening} error={error} onOpen={open} onCreate={create} />
  return <FolderView key={folder.root} folder={folder} onClose={close} settings={settings} onSettingsChange={changeSettings} />
}

function FolderView({
  folder,
  onClose,
  settings,
  onSettingsChange,
}: {
  folder: FolderInfo
  onClose: () => void
  settings: Settings
  onSettingsChange: (next: Partial<Settings>) => void
}) {
  const tree = useTree(folder.root)
  const [picked, setPicked] = useState<string | null>(null)
  const file = useFileView(picked)
  return (
    // Both start at their widest.
    <ColumnProvider placement="docked" minWidth={COLUMN_MIN} maxWidth={COLUMN_MAX} defaultWidth={COLUMN_MIN}>
      <SkipLink href="#main">Skip to content</SkipLink>
      <Layout>
        <Column side="left" aria-label="Files">
          <ColumnDrawer>
            <ColumnHeader>
              {/* The folder's name over its files; the page's one heading. */}
              <h1 className="flex-1 self-center truncate px-3 py-1 text-sm font-semibold">
                <span className="pattern-text">{folder.name}</span>
              </h1>
              <ColumnClose />
            </ColumnHeader>
            {/* The folder's files, read and kept current by use-tree.ts. */}
            <ColumnContent className="overflow-y-auto">
              {tree ? <FileTree tree={tree} selected={picked} onSelect={setPicked} /> : <p className="p-3 text-sm text-neutral-11">Reading the folder…</p>}
            </ColumnContent>
            <SettingsDrawer settings={settings} onChange={onSettingsChange} onCloseProject={onClose} />
            <ColumnFooter>
              <ColumnDrawerTrigger>Settings</ColumnDrawerTrigger>
            </ColumnFooter>
          </ColumnDrawer>
        </Column>
        <Page>
          <PageHeader>
            <ColumnTrigger side="left" always aria-label="Files" className={ICON_CELL} />
            <FileViewHeader view={file} />
            <ColumnTrigger side="right" always aria-label="Claude" className={ICON_CELL} />
          </PageHeader>
          {/* The file view scrolls its own body, so the page itself is not a
              scroller or a tab stop (FileView.tsx). */}
          <PageContent id="main" tabIndex={-1} className="flex flex-col overflow-hidden">
            <FileViewBody view={file} />
          </PageContent>
          <PageFooter />
        </Page>
        <Column side="right" aria-label="Claude">
          <ColumnHeader>
            <h2 className="flex-1 self-center truncate px-3 py-1 text-sm font-semibold">
              <span className="pattern-text">Claude</span>
            </h2>
            <ColumnClose />
          </ColumnHeader>
          {/* Claude Code in the folder (Terminal.tsx), filling the column. */}
          <ColumnContent className="relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col overflow-hidden">
              <Terminal shown />
            </div>
          </ColumnContent>
          <ColumnFooter />
        </Column>
      </Layout>
    </ColumnProvider>
  )
}
