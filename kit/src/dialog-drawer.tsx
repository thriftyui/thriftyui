'use client'

import type { ComponentProps } from 'react'
import { ColumnDrawer, ColumnDrawerClose, ColumnDrawerContent, ColumnDrawerTrigger } from './column-drawer.tsx'

// The column's drawer under the dialog's name.
//
//   <DialogContent>
//     <DialogDrawer>
//       <DialogHeader>...</DialogHeader>
//       <div className="min-h-0 flex-1 overflow-y-auto">...</div>
//       <DialogDrawerContent aria-label="...">...</DialogDrawerContent>
//       <DialogFooter><DialogDrawerTrigger>...</DialogDrawerTrigger></DialogFooter>
//     </DialogDrawer>
//   </DialogContent>

/** A dialog's drawer, rising from its DialogFooter over the dialog's body:
 *  the column's drawer (ColumnDrawer) under the dialog's name, the same
 *  props and keys. The first Escape inside it closes it, the next the
 *  dialog. */
export function DialogDrawer(props: ComponentProps<typeof ColumnDrawer>) {
  return <ColumnDrawer {...props} />
}

/** Fills its footer: one control, one cell the footer's width. */
export function DialogDrawerTrigger(props: ComponentProps<typeof ColumnDrawerTrigger>) {
  return <ColumnDrawerTrigger {...props} />
}

/** How tall it rises: `rows`, `header` and `size`, as the column's drawer
 *  takes them (column-drawer.tsx). */
export function DialogDrawerContent(props: ComponentProps<typeof ColumnDrawerContent>) {
  return <ColumnDrawerContent {...props} />
}

/** Closes it from inside, focus going back to its button. */
export function DialogDrawerClose(props: ComponentProps<typeof ColumnDrawerClose>) {
  return <ColumnDrawerClose {...props} />
}
