import { useFile } from './use-file'

/** What the file view's header and body share (FileView.tsx): the file
 *  picked, and what it holds. */
export function useFileView(path: string | null) {
  const content = useFile(path)
  return { path, content }
}

export type FileViewState = ReturnType<typeof useFileView>
