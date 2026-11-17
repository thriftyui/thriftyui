import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { AiNotice, Composer, Conversation, Message, Pending, Sources, Suggestions } from './chat.tsx'

describe('Conversation', () => {
  it('is a named log, a tab stop, busy while a reply comes', async () => {
    const { container, rerender } = render(
      <Conversation busy>
        <AiNotice />
        <Message from="user">Hello</Message>
        <Message from="assistant">
          <Pending />
        </Message>
      </Conversation>,
    )
    const log = screen.getByRole('log', { name: 'Conversation' })
    expect(log.getAttribute('tabindex')).toBe('0')
    expect(log.getAttribute('aria-busy')).toBe('true')
    await expectNoA11yViolations(container)
    rerender(
      <Conversation>
        <Message from="assistant">Hi.</Message>
      </Conversation>,
    )
    expect(log.getAttribute('aria-busy')).toBe('false')
  })

  it('says who said each message, to a screen reader', () => {
    render(
      <Conversation>
        <Message from="user">Hello</Message>
        <Message from="assistant" name="Support">
          Hi.
        </Message>
      </Conversation>,
    )
    const log = screen.getByRole('log')
    expect(log.textContent).toBe('You: HelloSupport: Hi.')
  })
})

describe('Sources', () => {
  it('lists each source once, numbered, linked where it has an address', async () => {
    const { container } = render(
      <Sources
        sources={[
          { title: 'Dark mode', href: '/guides/dark-mode' },
          { title: 'Dark mode', href: '/guides/dark-mode' },
          { title: 'Release notes' },
        ]}
      />,
    )
    const list = screen.getByRole('list', { name: 'Sources' })
    expect(list.tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Dark mode' }).getAttribute('href')).toBe('/guides/dark-mode')
    await expectNoA11yViolations(container)
  })

  it('draws its links with the app\'s own link when given', () => {
    const Own = ({ href, children }: { href: string; children?: React.ReactNode }) => (
      <a href={href} data-own="">
        {children}
      </a>
    )
    render(<Sources sources={[{ title: 'Dark mode', href: '/guides/dark-mode' }]} linkAs={Own} />)
    expect(screen.getByRole('link', { name: 'Dark mode' }).hasAttribute('data-own')).toBe(true)
  })

  it('draws nothing with no sources', () => {
    const { container } = render(<Sources sources={[]} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('Suggestions', () => {
  it('hands back the text of the one picked', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Suggestions items={['What is it built on?', 'How does dark mode work?']} onPick={onPick} />)
    expect(screen.getByRole('group', { name: 'Suggestions' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'How does dark mode work?' }))
    expect(onPick).toHaveBeenCalledWith('How does dark mode work?')
  })
})

describe('Composer', () => {
  it('sends on Enter and empties, makes a new line on Shift+Enter, sends nothing empty', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<Composer onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    await user.type(box, '{Enter}')
    expect(onSend).not.toHaveBeenCalled()
    await user.type(box, 'First line{Shift>}{Enter}{/Shift}second')
    expect((box as HTMLTextAreaElement).value).toBe('First line\nsecond')
    expect(send.disabled).toBe(false)
    await user.type(box, '{Enter}')
    expect(onSend).toHaveBeenCalledWith('First line\nsecond')
    expect((box as HTMLTextAreaElement).value).toBe('')
    await expectNoA11yViolations(container)
  })

  it('does not send while an input method is composing', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    fireEvent.change(box, { target: { value: 'にほん' } })
    fireEvent.keyDown(box, { key: 'Enter', isComposing: true })
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('にほん')
  })

  it('shows Stop while a reply comes, keeping what is typed until it is done', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<Composer onSend={onSend} onStop={onStop} busy />)
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    const box = screen.getByRole('textbox', { name: 'Message' })
    await user.type(box, 'Next{Enter}')
    expect(onSend).not.toHaveBeenCalled()
    expect((box as HTMLTextAreaElement).value).toBe('Next')
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalled()
    rerender(<Composer onSend={onSend} onStop={onStop} />)
    await user.type(box, '{Enter}')
    expect(onSend).toHaveBeenCalledWith('Next')
  })
})

describe('Composer, held by the app', () => {
  it('takes its text from the app, gives keys to the app first, and shows tools beside Send', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    function Held() {
      const [text, setText] = useState('/')
      return (
        <Composer
          onSend={onSend}
          value={text}
          onValueChange={setText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text === '/') {
              e.preventDefault()
              setText('/clear ')
            }
          }}
          fieldProps={{ 'aria-autocomplete': 'list' }}
          tools={<button type="button">Mode</button>}
        />
      )
    }
    const { container } = render(<Held />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    expect(box.value).toBe('/')
    expect(box.getAttribute('aria-autocomplete')).toBe('list')
    expect(screen.getByRole('button', { name: 'Mode' })).toBeTruthy()
    await user.click(box)
    await user.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
    expect(box.value).toBe('/clear ')
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('/clear')
    await expectNoA11yViolations(container)
  })
})

describe('Composer, with commands', () => {
  const COMMANDS = [
    { name: 'add-dir', hint: '<path>', description: 'Add a directory' },
    { name: 'clear', description: 'Start again', aliases: ['new'] },
    { name: 'color', description: 'Set a colour' },
    { name: 'model', description: 'Choose the model' },
  ]

  it('lists the commands for a "/", names the highlighted one from the box, and runs it on Enter', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<Composer onSend={onSend} commands={COMMANDS} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    expect(box.getAttribute('aria-haspopup')).toBe('listbox')
    await user.click(box)
    await user.keyboard('/')
    const list = screen.getByRole('listbox', { name: 'Commands' })
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(box.getAttribute('aria-controls')).toBe(list.id)
    expect(box.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id)
    await user.keyboard('adddir')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['/add-dir <path>Add a directory'])
    expect(screen.getByRole('option').getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('/add-dir')
    expect((box as HTMLTextAreaElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('highlights by an alias; after a typo highlights nothing and sends the text as typed', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<Composer onSend={onSend} commands={COMMANDS} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    await user.click(box)
    await user.keyboard('/new')
    expect(screen.getAllByRole('option').map((o) => o.id === box.getAttribute('aria-activedescendant'))).toEqual([true])
    await user.clear(box)
    await user.keyboard('/clr')
    expect(screen.getAllByRole('option').map((o) => o.textContent?.split(' ')[0].replace(/[A-Z].*/, ''))).toEqual(['/clear', '/color'])
    expect(box.getAttribute('aria-activedescendant')).toBeNull()
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('/clr')
  })

  it('moves with the arrows, wrapping round; Tab puts the command in the box; Escape closes the menu', async () => {
    const user = userEvent.setup()
    render(<Composer onSend={() => {}} commands={COMMANDS} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    await user.click(box)
    await user.keyboard('/')
    const options = () => screen.getAllByRole('option')
    await user.keyboard('{ArrowUp}')
    expect(box.getAttribute('aria-activedescendant')).toBe(options()[3].id)
    await user.keyboard('{ArrowDown}')
    expect(box.getAttribute('aria-activedescendant')).toBe(options()[0].id)
    await user.keyboard('{ArrowDown}{Tab}')
    expect(box.value).toBe('/clear ')
    expect(document.activeElement).toBe(box)
    expect(screen.queryByRole('listbox')).toBeNull()
    await user.clear(box)
    await user.keyboard('/c{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    await user.keyboard('o')
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('after a typo, Tab takes the first close match', async () => {
    const user = userEvent.setup()
    render(<Composer onSend={() => {}} commands={COMMANDS} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    await user.click(box)
    await user.keyboard('/clr{Tab}')
    expect(box.value).toBe('/clear ')
  })

  it('says when nothing matches, and gives a chosen command to onCommand first', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const onCommand = vi.fn((c: { name: string }) => c.name === 'model')
    render(<Composer onSend={onSend} onCommand={onCommand} commands={COMMANDS} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    await user.click(box)
    await user.keyboard('/zzz')
    expect(screen.getByRole('status').textContent).toBe('No commands match /zzz')
    await user.clear(box)
    await user.keyboard('/model{Enter}')
    expect(onCommand).toHaveBeenCalledWith(COMMANDS[3])
    expect(onSend).not.toHaveBeenCalled()
    expect((box as HTMLTextAreaElement).value).toBe('')
    await user.keyboard('/clear{Enter}')
    expect(onSend).toHaveBeenCalledWith('/clear')
  })

  it('has no menu, and none of its attributes, without commands', async () => {
    const user = userEvent.setup()
    render(<Composer onSend={() => {}} />)
    const box = screen.getByRole('textbox', { name: 'Message' })
    await user.click(box)
    await user.keyboard('/')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(box.getAttribute('aria-haspopup')).toBeNull()
  })
})
