import { createContext, useContext } from 'react'
import type { Arrangement, Slide } from './examples/arrangements'
import type { Placement } from 'thriftyui/column'

// The prototype's settings, held by the app (src/App.tsx) and changed from
// its pages: which columns there are, where they sit on a wide window,
// how the right column's and the drawer's bodies are arranged and slide,
// and whether the page snaps as it scrolls.

export type Shape = 'page' | 'left' | 'right' | 'both'

export interface Settings {
  shape: Shape
  setShape: (s: Shape) => void
  placement: Placement
  setPlacement: (p: Placement) => void
  snap: boolean
  setSnap: (s: boolean) => void
  details: Arrangement
  setDetails: (a: Arrangement) => void
  detailsSlide: Slide
  setDetailsSlide: (s: Slide) => void
  /** The left column's drawer: tabs, arrows or a list, all in its header. */
  drawer: Arrangement
  setDrawer: (a: Arrangement) => void
  drawerSlide: Slide
  setDrawerSlide: (s: Slide) => void
  drawerSize: DrawerSize
  setDrawerSize: (s: DrawerSize) => void
  /** Which way the text runs: set on the page's root and given to Radix's
   *  Direction.Provider, which the kit's parts read. */
  dir: 'ltr' | 'rtl'
  setDir: (d: 'ltr' | 'rtl') => void
}

/** The drawer's height as the Drawer page offers it: one row, three rows,
 *  half the column, or all the way. */
export type DrawerSize = '1' | '3' | 'half' | 'full'

export const SettingsContext = createContext<Settings | null>(null)

export function useSettings() {
  const s = useContext(SettingsContext)
  if (!s) throw new Error('useSettings must be inside the app.')
  return s
}
