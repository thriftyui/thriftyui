// Files dropped on the terminal, typed in as their paths the way Ghostty
// does on macOS, checked
// against Ghostty's own source: each path with a backslash before every
// shell-sensitive character, several joined by spaces
// (github.com/ghostty-org/ghostty at 04d685c, macos/Sources/Ghostty/Ghostty.Shell.swift:
// `escapeCharacters = "\\ ()[]{}<>\"'`!#$&;|*?\t"`, `escape`). Claude Code
// reads a dropped image's path as an attachment.
//
// Where a drop landed is tested against the terminal's box in the page's
// own pixels. Two sources disagree on the drop's position: Tauri's API says
// "Positions are in physical pixels, relative to the webview's top-left
// corner" (@tauri-apps/api 2.12.4, webview.d.ts, DragDropEvent); on
// this Mac they are in points already -- dividing them put every drop in the
// window's left half (wry takes them from AppKit's draggingLocation). What was seen is followed: the
// position is used as it comes. [open] Checked again in the app.

const ESCAPED = new Set('\\ ()[]{}<>"\'`!#$&;|*?\t')

/** A path with a backslash before each character Ghostty escapes. */
export function shellEscape(path: string): string {
  let out = ''
  for (const ch of path) out += ESCAPED.has(ch) ? `\\${ch}` : ch
  return out
}

/** What a drop of `paths` types into the terminal. */
export function droppedText(paths: string[]): string {
  return paths.filter(Boolean).map(shellEscape).join(' ')
}

/** Whether a drop at `at` landed inside `box` (getBoundingClientRect). An
 *  empty box (hidden) never holds one. */
export function droppedInside(at: { x: number; y: number }, box: { left: number; top: number; right: number; bottom: number }): boolean {
  if (box.right <= box.left || box.bottom <= box.top) return false
  return at.x >= box.left && at.x < box.right && at.y >= box.top && at.y < box.bottom
}
