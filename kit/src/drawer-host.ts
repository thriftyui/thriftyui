'use client'

import { createContext, useContext } from 'react'

/** Internal (not exported). A drawer inside a column or dialog registers
 *  how to close itself, so Escape closes the drawer before the sheet or
 *  dialog; returns whether it closed anything. */
export const DrawerHost = createContext<((close: (() => boolean) | null) => void) | null>(null)

/** Internal: a drawer's way to register its close. */
export const useDrawerHost = () => useContext(DrawerHost)
