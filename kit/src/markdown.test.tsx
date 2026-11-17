import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from './markdown.tsx'

describe('Markdown', () => {
  it('draws what an assistant writes: emphasis, lists, links, code, tables', () => {
    const { container } = render(
      <Markdown>{'Use **Tabs**.\n\n- one\n- two\n\nSee [the guide](/guides/dark-mode) and `cn`.\n\n| a | b |\n|---|---|\n| 1 | 2 |'}</Markdown>,
    )
    expect(container.querySelector('strong')?.textContent).toBe('Tabs')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'the guide' }).getAttribute('href')).toBe('/guides/dark-mode')
    expect(container.querySelector('code')?.textContent).toBe('cn')
    expect(screen.getByRole('table')).toBeTruthy()
  })

  it('escapes HTML and makes unsafe links go nowhere', () => {
    const { container } = render(<Markdown>{'<img src=x onerror="alert(1)"> <script>alert(2)</script>\n\n[click](javascript:alert(3))'}</Markdown>)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    const link = screen.getByText('click').closest('a')
    expect(link?.getAttribute('href') ?? '').not.toMatch(/javascript/i)
  })
  it('draws its links with the app\'s own link when given, the address already made safe', () => {
    const Own = ({ href, children }: { href: string; children?: React.ReactNode }) => (
      <a href={href} data-own="">
        {children}
      </a>
    )
    render(<Markdown linkAs={Own}>{'[guide](/guides/dark-mode) [bad](javascript:alert(1))'}</Markdown>)
    expect(screen.getByRole('link', { name: 'guide' }).hasAttribute('data-own')).toBe(true)
    expect(screen.queryByRole('link', { name: 'bad' })?.getAttribute('href') ?? '').not.toMatch(/javascript/i)
  })

  it('makes a code block a tab stop, so the keyboard can scroll it', () => {
    const { container } = render(<Markdown>{'```\nconst a = 1\n```'}</Markdown>)
    expect(container.querySelector('pre')?.getAttribute('tabindex')).toBe('0')
  })

  it("names a task list's checkboxes by their tasks", () => {
    render(<Markdown>{'- [x] Ship the kit\n- [ ] Write the **changelog**\n  - [ ] nested'}</Markdown>)
    const done = screen.getByRole('checkbox', { name: 'Ship the kit' }) as HTMLInputElement
    expect(done.checked).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'Write the changelog' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'nested' })).toBeTruthy()
  })
})
