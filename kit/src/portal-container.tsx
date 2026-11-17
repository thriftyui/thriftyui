'use client'

import { createContext, useContext } from 'react'

// Parts placed fixed stay inside the element only if it has a transform
// (a fixed element is placed against the window otherwise). Menus,
// popovers and tooltips are not moved by it.
//
//   <PortalContainer.Provider value={frame}>...</PortalContainer.Provider>

/** Where the kit's parts that open over the whole window -- Dialog, Alert
 *  Dialog, Sheet, Gallery's large view, a column's sheet -- are drawn: the
 *  page's body unless an element is given by its Provider. The element
 *  needs a transform to hold them inside it. */
export const PortalContainer = createContext<HTMLElement | null>(null)

/** The element to draw into, or undefined for the page's body, as Radix's
 *  Portal takes it. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainer) ?? undefined
}
