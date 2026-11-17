import { useMemo } from 'react'
import { File, FileCode, FileText, Folder } from 'lucide-react'
import { Tree, type TreeItem } from 'thriftyui/tree'

// A folder's files as a tree: folders that open and close, files that are
// picked. Made from the kit:
// the folder itself as the first row, open; folders before files, each in
// name order, as the app gives them; a chevron and a folder for a folder, an
// icon by kind for a file. The tree does not add, rename or move files.
//
// The tree, its keys and its roles are the kit's Tree (kit/src/tree.tsx,
// the W3C's Tree View pattern); this block gives it the folder, a path for
// each item's id, and the icons.

export interface FileNode {
  name: string
  /** From the folder, "/" between parts; "" for the folder itself. */
  path: string
  /** A folder's; none for a file. */
  children?: FileNode[]
}

function iconFor(name: string) {
  if (/\.(rs|ts|tsx|js|jsx|mjs|py|css|html|json)$/.test(name)) return FileCode
  if (/\.(md|txt|log)$/.test(name)) return FileText
  return File
}

const toItem = (node: FileNode): TreeItem => {
  const Icon = node.children ? Folder : iconFor(node.name)
  return {
    id: node.path,
    label: node.name,
    icon: <Icon strokeWidth={1.75} />,
    children: node.children?.map(toItem),
  }
}

export function FileTree({
  tree,
  selected,
  onSelect,
  'aria-label': label = 'Files',
}: {
  tree: FileNode
  selected: string | null
  onSelect: (path: string) => void
  'aria-label'?: string
}) {
  const items = useMemo(() => [toItem(tree)], [tree])
  return <Tree items={items} selected={selected} onSelect={onSelect} defaultOpen={[tree.path]} aria-label={label} />
}
