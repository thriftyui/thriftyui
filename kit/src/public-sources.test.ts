import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The code beside the kit in its repository cites a source by its maker's
// public page or repository, never by a local clone's folder, which no
// reader has. The kit's own comments are held to the same by
// comments.test.ts. In an app with its own copy of the kit, there is
// nothing to check.

const ROOT = join(import.meta.dirname, '..', '..')
const REPOSITORY = existsSync(join(ROOT, 'web/src/components.ts'))
const PLACES = ['web/src', 'builder/src', 'builder/src-tauri/src', 'builder/templates', 'templates', 'demo/src', 'starters', 'extensions', 'plugins']
const SKIP = new Set(['node_modules', 'dist', 'public', 'target'])
const TEXT = /\.(ts|tsx|rs|css|html|md|mjs|json|code)$/

function files(path: string): string[] {
  const full = join(ROOT, path)
  if (!existsSync(full)) return []
  if (statSync(full).isFile()) return [path]
  return readdirSync(full).flatMap((name) => (SKIP.has(name) ? [] : files(join(path, name))))
}

describe.runIf(REPOSITORY)('sources cited where anyone can read them', () => {
  const all = PLACES.flatMap(files).filter((f) => TEXT.test(f))

  it('reads the files it means to', () => {
    expect(all.length).toBeGreaterThan(200)
  })

  it('names no local clone', () => {
    const found = all.flatMap((file) =>
      readFileSync(join(ROOT, file), 'utf8')
        .split('\n')
        .flatMap((line, i) => (/reference-repos/.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
    )
    expect(found).toEqual([])
  })
})
