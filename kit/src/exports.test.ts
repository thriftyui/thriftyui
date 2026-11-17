import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as kit from './index.ts'

// What an app can import. The drawers' wiring (drawer-host.ts) and the
// bottom sheets' drag (sheet-drag.ts) and how focus is moved after a press
// (input-modality.ts) are the kit's own: not in the root,
// and their entries mapped to null, so importing them fails (Node,
// ERR_PACKAGE_PATH_NOT_EXPORTED).

describe("The kit's exports", () => {
  it('leave out the drawers wiring', () => {
    expect('DrawerHost' in kit).toBe(false)
    expect('useDrawerHost' in kit).toBe(false)
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'))
    expect(pkg.exports['./drawer-host']).toBeNull()
  })

  it("leave out the sheets' drag", () => {
    expect('useSheetDrag' in kit).toBe(false)
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'))
    expect(pkg.exports['./sheet-drag']).toBeNull()
  })

  it('leave out how focus is moved after a press', () => {
    expect('openQuietly' in kit).toBe(false)
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'))
    expect(pkg.exports['./input-modality']).toBeNull()
  })
})
