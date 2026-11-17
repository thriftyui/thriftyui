import { useEffect, useState } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { FileNode } from './FileTree'

// The open app's files as a tree (src-tauri/src/tree.rs), read when the
// app opens and again whenever the watcher says files changed
// (`fs-changed`).

export function useTree(root: string): FileNode | null {
  const [tree, setTree] = useState<FileNode | null>(null)
  useEffect(() => {
    if (!isTauri()) return
    let live = true
    const load = () => invoke<FileNode>('list_tree').then((t) => live && setTree(t), () => {})
    void load()
    const off = listen<string[]>('fs-changed', () => void load())
    return () => {
      live = false
      void off.then((f) => f())
    }
  }, [root])
  return tree
}
