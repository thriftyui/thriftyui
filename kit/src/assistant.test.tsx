import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { ApprovalCard } from './approval-card.tsx'
import { Diff } from './diff.tsx'
import { TodoList } from './todo-list.tsx'
import { ToolCall } from './tool-call.tsx'

describe('ToolCall', () => {
  it('is a line that opens to its detail by Enter and Space, saying whether it is open', async () => {
    const { container } = render(
      <ToolCall action="Read" subject="src/app.ts">
        <p>The file's text</p>
      </ToolCall>,
    )
    const line = screen.getByRole('button', { name: 'Read src/app.ts' })
    expect(line.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText("The file's text")).toBeNull()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(line.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText("The file's text")).toBeTruthy()
    await expectNoA11yViolations(container)
    await userEvent.keyboard(' ')
    expect(line.getAttribute('aria-expanded')).toBe('false')
  })

  it('is a plain line with no detail', () => {
    render(<ToolCall action="Listed" subject="*.ts">{null}</ToolCall>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('*.ts')).toBeTruthy()
  })

  it('says it failed in words, and that it runs to a screen reader', () => {
    const { rerender } = render(<ToolCall action="Ran" subject="npm test" failed />)
    expect(screen.getByText('failed')).toBeTruthy()
    rerender(<ToolCall action="Ran" subject="npm test" running />)
    expect(screen.getByText('running').className).toContain('sr-only')
  })
})

describe('Diff', () => {
  it('marks removed lines as deletions and added as insertions, signed in the text', async () => {
    const { container } = render(<Diff removed={'a\nb'} added="c" aria-label="The change to app.ts" />)
    const dels = container.querySelectorAll('del')
    const ins = container.querySelectorAll('ins')
    expect([...dels].map((d) => d.textContent)).toEqual(['- a', '- b'])
    expect([...ins].map((d) => d.textContent)).toEqual(['+ c'])
    expect(screen.getByLabelText('The change to app.ts').tagName).toBe('PRE')
    await expectNoA11yViolations(container)
  })

  it('draws only added lines for a new file', () => {
    const { container } = render(<Diff added="x" aria-label="New file" />)
    expect(container.querySelectorAll('del')).toHaveLength(0)
    expect(container.querySelectorAll('ins')).toHaveLength(1)
  })
})

describe('TodoList', () => {
  it('is a list named by its title, each state said in words, the one being done the current step', async () => {
    const { container } = render(
      <TodoList
        items={[
          { content: 'Read the file', status: 'completed' },
          { content: 'Run the tests', status: 'in_progress', activeForm: 'Running the tests' },
          { content: 'Commit', status: 'pending' },
        ]}
      />,
    )
    const list = screen.getByRole('list', { name: 'To-do' })
    const items = screen.getAllByRole('listitem')
    expect(items.map((i) => i.textContent)).toEqual(['Done: Read the file', 'Doing: Running the tests', 'To do: Commit'])
    expect(items[1].getAttribute('aria-current')).toBe('step')
    expect(items[0].getAttribute('aria-current')).toBeNull()
    expect(list.tagName).toBe('UL')
    await expectNoA11yViolations(container)
  })
})

describe('ApprovalCard', () => {
  it('is a group named by its heading, with Allow, Always allow and Deny while it waits', async () => {
    const onAllow = vi.fn()
    const onAlways = vi.fn()
    const onDeny = vi.fn()
    const { container, rerender } = render(
      <ApprovalCard title="Allow Bash?" onAllow={onAllow} onAlwaysAllow={onAlways} onDeny={onDeny}>
        <p>npm test</p>
      </ApprovalCard>,
    )
    expect(screen.getByRole('group', { name: 'Allow Bash?' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Allow Bash?', level: 3 })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }))
    await userEvent.click(screen.getByRole('button', { name: 'Always allow' }))
    await userEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect([onAllow, onAlways, onDeny].map((f) => f.mock.calls.length)).toEqual([1, 1, 1])
    await expectNoA11yViolations(container)
    rerender(
      <ApprovalCard title="Allow Bash?" heading="h2" waiting={false} status="Denied" onAllow={onAllow} onDeny={onDeny}>
        <p>npm test</p>
      </ApprovalCard>,
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Denied')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  })

  it('draws no buttons for a question that carries its own answers', () => {
    render(
      <ApprovalCard title="Claude asks">
        <button type="button">Answer</button>
      </ApprovalCard>,
    )
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Answer'])
  })
})
