import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every package in the ThriftyUI repository that uses the kit names it by
// a range the kit's own version meets, never `*`: the workspace's copy is
// linked in by npm's workspaces, but `*` matches any version
// published under the name, so an install outside the workspace could get
// another.
// When the kit's version goes past the ranges -- 0.2.0 past ^0.1.0 -- this
// fails until they follow. In an app with its own copy of the kit, there
// is nothing to check.

const ROOT = join(import.meta.dirname, '..', '..')
const REPOSITORY = existsSync(join(ROOT, 'web/src/components.ts'))

const read = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))

/** Whether `version` meets a caret range, as npm's semver reads one:
 *  under 1.0.0 the minor is pinned, from it the major. */
function meets(range: string, version: string) {
  const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range)
  if (!m) return false
  const [a, b, c] = version.split('.').map(Number)
  const [x, y, z] = m.slice(1).map(Number)
  if (x > 0) return a === x && (b > y || (b === y && c >= z))
  return a === 0 && b === y && c >= z
}

describe.runIf(REPOSITORY)("the workspace's packages pin the kit", () => {
  const version: string = read('kit/package.json').version
  const packages: string[] = [...read('package.json').workspaces, 'builder'].filter((w: string) => w !== 'kit')
  const users = packages.flatMap((w) => {
    const pkg = existsSync(join(ROOT, w, 'package.json')) ? read(`${w}/package.json`) : null
    const range = pkg?.dependencies?.thriftyui ?? pkg?.devDependencies?.thriftyui
    return range ? [[w, range as string] as const] : []
  })

  it('finds the packages that use it', () => {
    expect(users.length).toBeGreaterThan(5)
  })

  it.each(users)('%s names a range the kit meets', (_, range) => {
    expect(meets(range, version), `${range} against the kit's ${version}`).toBe(true)
  })
})
