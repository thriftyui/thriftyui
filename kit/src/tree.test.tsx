import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Tree, type TreeItem } from './tree.tsx'

// The W3C's Tree View pattern (aria-practices, content/patterns/treeview/
// treeview-pattern.html): its roles and states, its keys, and where focus
// lands when the tree is entered.

const ITEMS: TreeItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'src/app.tsx', label: 'app.tsx' },
      { id: 'src/pages', label: 'pages', children: [{ id: 'src/pages/home.tsx', label: 'home.tsx' }] },
    ],
  },
  { id: 'readme.md', label: 'readme.md' },
]

function Files() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <>
      <button type="button">Before</button>
      <Tree items={ITEMS} selected={selected} onSelect={setSelected} defaultOpen={['src']} aria-label="Files" />
      <button type="button">After</button>
    </>
  )
}

const item = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name.replace('.', '\\.')}`) })

describe('Tree', () => {
  it('is a tree of treeitems, open items with aria-expanded, end items with aria-selected, children in a group', async () => {
    const { container } = render(<Files />)
    expect(screen.getByRole('tree', { name: 'Files' })).toBeTruthy()
    expect(item('src').getAttribute('aria-expanded')).toBe('true')
    expect(item('pages').getAttribute('aria-expanded')).toBe('false')
    expect(item('app.tsx').getAttribute('aria-selected')).toBe('false')
    expect(item('app.tsx').parentElement?.getAttribute('role')).toBe('group')
    expect(screen.queryByRole('treeitem', { name: 'home.tsx' })).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('moves by the arrows, Home and End, opens and closes, and picks with Enter', async () => {
    const user = userEvent.setup()
    render(<Files />)
    await user.click(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    expect(document.activeElement).toBe(item('src'))
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(item('pages'))
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(item('app.tsx'))
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowRight}')
    expect(item('pages').getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(item('pages'))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(item('home.tsx'))
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(item('pages'))
    await user.keyboard('{ArrowLeft}')
    expect(item('pages').getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(item('readme.md'))
    await user.keyboard('{Enter}')
    expect(item('readme.md').getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(item('src'))
    await user.keyboard('{Enter}')
    expect(item('src').getAttribute('aria-expanded')).toBe('false')
  })

  it('moves to the next item whose label starts with what is typed, letters typed together read as one', async () => {
    const user = userEvent.setup()
    render(<Files />)
    await user.click(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    await user.keyboard('r')
    expect(document.activeElement).toBe(item('readme.md'))
    // "ra" starts no label, so focus stays.
    await user.keyboard('a')
    expect(document.activeElement).toBe(item('readme.md'))
  })

  it("shows an item's end after its label, read as part of its name", () => {
    const items: TreeItem[] = [{ id: 'a', label: 'kick.wav', end: <span className="sr-only">, starred</span> }]
    render(<Tree items={items} selected={null} onSelect={() => {}} aria-label="Files" />)
    expect(screen.getByRole('treeitem', { name: 'kick.wav, starred' })).toBeTruthy()
  })

  it('is one tab stop, and is entered at the selected item', async () => {
    const user = userEvent.setup()
    render(<Files />)
    await user.click(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    await user.keyboard('{ArrowDown}{Enter}{ArrowDown}')
    expect(item('app.tsx').getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(item('pages'))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }))
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(item('app.tsx'))
  })

  it('picking a row draws only the rows that changed, once for focus and once for the pick, not the rest of a long list', async () => {
    let reads = 0
    const leaves: TreeItem[] = Array.from({ length: 200 }, (_, i) => ({
      id: `f${i}`,
      get label() {
        reads++
        return `Sample ${i}`
      },
    }))
    const long = [{ id: 'root', label: 'Samples', children: leaves }]
    function Long() {
      const [selected, setSelected] = useState<string | null>(null)
      return <Tree items={long} selected={selected} onSelect={setSelected} defaultOpen={['root']} aria-label="Samples" />
    }
    const user = userEvent.setup()
    render(<Long />)
    expect(reads).toBe(200)
    reads = 0
    await user.click(screen.getByText('Sample 100'))
    expect(item('Sample 100').getAttribute('aria-selected')).toBe('true')
    expect(reads).toBeLessThanOrEqual(4)
    reads = 0
    await user.click(screen.getByText('Sample 150'))
    expect(item('Sample 150').getAttribute('aria-selected')).toBe('true')
    expect(item('Sample 100').getAttribute('aria-selected')).toBe('false')
    expect(reads).toBeLessThanOrEqual(4)
  })
})
