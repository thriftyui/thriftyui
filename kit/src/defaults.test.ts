import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// A prop of the kit's own that a part gives a default -- in its
// parameter's destructuring, `size = 'md'` -- says so where the prop is
// declared, by TSDoc's @defaultValue, and says the value the code uses. A prop the part takes
// from Radix or the browser and gives a default of its own is named in the
// part's doc comment instead, as its type is not the kit's to annotate.

const SRC = import.meta.dirname

type Found = { where: string; prop: string; value: string; documented: string | null }

function defaultsIn(file: string): Found[] {
  const text = readFileSync(join(SRC, file), 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const aliases = new Map<string, ts.Node>()
  for (const s of sf.statements) if (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) aliases.set(s.name.text, ts.isTypeAliasDeclaration(s) ? s.type : s)
  const members = (node: ts.Node | undefined, seen = new Set<string>()): ts.PropertySignature[] => {
    if (!node) return []
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) return node.types.flatMap((t) => members(t, seen))
    if (ts.isParenthesizedTypeNode(node)) return members(node.type, seen)
    if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
      const own = node.members.filter(ts.isPropertySignature)
      const ext = ts.isInterfaceDeclaration(node) ? (node.heritageClauses ?? []).flatMap((h) => h.types.flatMap((t) => members(aliases.get(t.expression.getText()), seen))) : []
      return [...own, ...ext]
    }
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText()
      if (seen.has(name) || !aliases.has(name)) return []
      seen.add(name)
      return members(aliases.get(name), seen)
    }
    return []
  }
  const found: Found[] = []
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const param = node.parameters[0]
      if (param && ts.isObjectBindingPattern(param.name)) {
        const props = members(param.type)
        for (const el of param.name.elements) {
          if (!el.initializer || el.dotDotDotToken) continue
          const prop = (el.propertyName ?? el.name).getText()
          const sig = props.find((p) => p.name.getText() === prop)
          if (!sig) continue
          const docs = ts.getJSDocCommentsAndTags(sig).filter(ts.isJSDoc)
          const tag = docs.flatMap((d) => d.tags ?? []).find((t) => t.tagName.text === 'defaultValue')
          const documented = tag ? (ts.getTextOfJSDocComment(tag.comment) ?? '').trim().replace(/^`|`$/g, '') : null
          found.push({ where: `${file} ${node.name?.text}`, prop, value: el.initializer.getText(), documented })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

describe("the kit's own props say their defaults", () => {
  const all = readdirSync(SRC)
    .filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))
    .flatMap(defaultsIn)

  it('finds them', () => {
    expect(all.length).toBeGreaterThan(50)
  })

  it('each with @defaultValue, the value the code uses', () => {
    const wrong = all.filter((f) => f.documented !== f.value).map((f) => `${f.where}: ${f.prop} = ${f.value}, documented ${f.documented ?? 'not at all'}`)
    expect(wrong).toEqual([])
  })
})
