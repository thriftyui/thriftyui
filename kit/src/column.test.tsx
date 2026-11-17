import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, useRef, useState, type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { useFocusOnChange } from './use-focus-on-change.ts'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { setWide, setWidths } from './test/window.ts'
import {
  Column,
  ColumnBar,
  ColumnBarItem,
  ColumnClose,
  ColumnContent,
  ColumnHeader,
  ColumnProvider,
  ColumnToolbar,
  ColumnTrigger,
  COLUMN_MIN_WIDTH,
  type Placement,
} from './column.tsx'
import { Layout, Page, PageContent, PageFooter, PageHeader } from './page.tsx'

let restore: (() => void)[] = []
afterEach(() => {
  restore.forEach((r) => r())
  restore = []
})

function App({ placement = 'docked', sides = ['left', 'right'] }: { placement?: Placement; sides?: ('left' | 'right')[] }) {
  const left = sides.includes('left')
  const right = sides.includes('right')
  return (
    <ColumnProvider placement={placement}>
      <Layout>
        {left && (
          <Column side="left" aria-label="Pages">
            <ColumnHeader>Pages</ColumnHeader>
            <ColumnContent>
              <a href="/a">A link</a>
            </ColumnContent>
          </Column>
        )}
        <Page>
          <PageHeader>
            {left && !right && <ColumnTrigger side="left" icon="menu" aria-label="Open pages" />}
            <h1>Title</h1>
          </PageHeader>
          <PageContent>Body</PageContent>
          <PageFooter>{placement === 'floating' && <ColumnToolbar sides={sides} />}</PageFooter>
        </Page>
        {right && (
          <Column side="right" sheet="bottom" aria-label="Details">
            <ColumnHeader>Details</ColumnHeader>
          </Column>
        )}
        {left && right && (
          <ColumnBar>
            <ColumnBarItem side="left" icon="menu">
              Pages
            </ColumnBarItem>
            <ColumnBarItem side="right">Details</ColumnBarItem>
          </ColumnBar>
        )}
      </Layout>
    </ColumnProvider>
  )
}

describe('the page', () => {
  it('has its landmarks: banner, main, contentinfo', () => {
    restore.push(setWide(true))
    render(<App sides={[]} />)
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })
})

describe('columns beside the page (wide)', () => {
  it('are named complementary landmarks, each with a splitter as the W3C pattern has it', async () => {
    restore.push(setWide(true))
    const { container } = render(<App />)
    const pages = screen.getByRole('complementary', { name: 'Pages' })
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeTruthy()
    // Marked as a column, for what themes columns (shadcn.css).
    expect(pages.hasAttribute('data-column')).toBe(true)
    const splitter = screen.getByRole('separator', { name: 'Resize pages' })
    expect(splitter.getAttribute('aria-orientation')).toBe('vertical')
    expect(splitter.getAttribute('aria-controls')).toBe(pages.id)
    expect(splitter.getAttribute('aria-valuenow')).toBe('256')
    expect(splitter.getAttribute('tabindex')).toBe('0')
    await expectNoA11yViolations(container)
  })

  it('with resizable={false}, has no splitter, at the width it is given', async () => {
    restore.push(setWide(true))
    const { container } = render(
      <ColumnProvider minWidth={275} maxWidth={275} defaultWidth={275}>
        <Layout>
          <Column side="left" aria-label="Main" resizable={false}>
            <ColumnContent>Links</ColumnContent>
          </Column>
          <Page>
            <PageContent>Feed</PageContent>
          </Page>
        </Layout>
      </ColumnProvider>,
    )
    expect(screen.getByRole('complementary', { name: 'Main' })).toBeTruthy()
    expect(screen.queryByRole('separator')).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('resize by the keyboard: arrows by 16px (Shift 64), Home and End, Enter collapses and restores', async () => {
    restore.push(setWide(true))
    // A column as wide as it is set, beside an 800px page: room to grow to 480.
    restore.push(
      setWidths((el) => (el.tagName === 'ASIDE' ? parseFloat((el as HTMLElement).style.width) || 0 : el.matches('div.flex-1.flex-col') ? 800 : 0)),
    )
    const user = userEvent.setup()
    render(<App />)
    const splitter = screen.getByRole('separator', { name: 'Resize pages' })
    splitter.focus()
    await user.keyboard('{ArrowRight}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('272')
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('336')
    await user.keyboard('{ArrowLeft}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('320')
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('256')
    await user.keyboard('{End}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('480')
    await user.keyboard('{Home}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('224')
    await user.keyboard('{Enter}')
    expect(splitter.getAttribute('aria-valuetext')).toBe('Collapsed')
    // Collapsed, its contents are inert; the splitter in it stays.
    expect(screen.getByRole('complementary', { hidden: true, name: 'Pages' }).firstElementChild?.hasAttribute('inert')).toBe(true)
    await user.keyboard('{Enter}')
    expect(splitter.getAttribute('aria-valuenow')).toBe('224')
  })
})

describe('columns over the page (wide)', () => {
  it('have the toolbar: its controls named, Hide pressing and hiding the column', async () => {
    restore.push(setWide(true))
    const user = userEvent.setup()
    render(<App placement="floating" />)
    const toolbar = screen.getByRole('toolbar', { name: 'Columns' })
    for (const name of ['Reset', 'Flip', 'Align left', 'Center', 'Align right', 'Hide left', 'Hide both', 'Hide right'])
      expect(toolbar.querySelector(`[aria-label="${name}"]`)).toBeTruthy()
    const hideLeft = screen.getByRole('button', { name: 'Hide left' })
    await user.click(hideLeft)
    expect(hideLeft.getAttribute('aria-pressed')).toBe('true')
    // Hidden over the page, the column itself is inert.
    expect(screen.getByRole('complementary', { hidden: true, name: 'Pages' }).hasAttribute('inert')).toBe(true)
  })
})

describe('defaultWidth', () => {
  it('starts both columns at the width given, kept within the limits', () => {
    restore.push(setWide(true))
    const { unmount } = render(
      <ColumnProvider defaultWidth={COLUMN_MIN_WIDTH}>
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnContent>Left</ColumnContent>
          </Column>
          <Page>
            <PageContent>Body</PageContent>
          </Page>
        </Layout>
      </ColumnProvider>,
    )
    expect((screen.getByRole('complementary', { name: 'Pages' }) as HTMLElement).style.width).toBe('224px')
    unmount()
    render(
      <ColumnProvider defaultWidth={10}>
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnContent>Left</ColumnContent>
          </Column>
        </Layout>
      </ColumnProvider>,
    )
    expect((screen.getByRole('complementary', { name: 'Pages' }) as HTMLElement).style.width).toBe(`${COLUMN_MIN_WIDTH}px`)
  })

  it('starts and keeps each side within its own limits when they are given per side', async () => {
    restore.push(setWide(true))
    const user = userEvent.setup()
    render(
      <ColumnProvider defaultWidth={{ left: 224, right: 300 }} minWidth={{ left: 224, right: 256 }} maxWidth={{ left: 256, right: 384 }}>
        <Layout>
          <Column side="left" aria-label="Files">
            <ColumnContent>Left</ColumnContent>
          </Column>
          <Page>
            <PageContent>Body</PageContent>
          </Page>
          <Column side="right" aria-label="Chat">
            <ColumnContent>Right</ColumnContent>
          </Column>
        </Layout>
      </ColumnProvider>,
    )
    const width = (name: string) => (screen.getByRole('complementary', { name }) as HTMLElement).style.width
    // Each starts at the width asked for it.
    expect(width('Files')).toBe('224px')
    expect(width('Chat')).toBe('300px')
    const splitter = (name: string) => screen.getByRole('separator', { name: `Resize ${name.toLowerCase()}` })
    expect(splitter('Files').getAttribute('aria-valuemax')).toBe('256')
    expect(splitter('Chat').getAttribute('aria-valuemax')).toBe('384')
    // Home goes to each side's own least.
    splitter('Chat').focus()
    await user.keyboard('{Home}')
    expect(width('Chat')).toBe('256px')
  })
})

describe('columns on a narrow window', () => {
  it('open as sheets after all at 320px when kept docked, so the page reflows', async () => {
    restore.push(setWide(false, false))
    render(
      <ColumnProvider narrow="docked">
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnContent>Home</ColumnContent>
          </Column>
          <Page>
            <PageHeader>
              <ColumnTrigger side="left" />
            </PageHeader>
            <PageContent>Body</PageContent>
          </Page>
        </Layout>
      </ColumnProvider>,
    )
    expect(screen.queryByRole('complementary')).toBeNull()
    // Its trigger is there again, opening the column as a sheet, a dialog.
    expect(screen.getByRole('button').getAttribute('aria-haspopup')).toBe('dialog')
  })

  it('stay beside the page when kept docked, with no button to open them', async () => {
    restore.push(setWide(false))
    render(
      <ColumnProvider narrow="docked">
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnHeader>
              Pages
              <ColumnTrigger side="left" />
            </ColumnHeader>
            <ColumnContent>Home</ColumnContent>
          </Column>
          <Page>
            <PageContent>Body</PageContent>
          </Page>
        </Layout>
      </ColumnProvider>,
    )
    expect(screen.getByRole('complementary', { name: 'Pages' })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open pages' })).toBeNull()
    expect(screen.getByRole('complementary').className).not.toContain('max-lg:hidden')
    await expectNoA11yViolations(document.body)
  })

  it('are sheets: one column opens from its header button, which says so', async () => {
    restore.push(setWide(false))
    const user = userEvent.setup()
    render(<App sides={['left']} />)
    expect(screen.queryByRole('complementary')).toBeNull()
    const open = screen.getByRole('button', { name: 'Open pages' })
    expect(open.getAttribute('aria-expanded')).toBe('false')
    await user.click(open)
    const sheet = await screen.findByRole('dialog', { name: 'Pages' })
    expect(open.getAttribute('aria-expanded')).toBe('true')
    await expectNoA11yViolations(document.body)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(sheet.isConnected).toBe(false)
    // Closed from inside, focus goes back to the button that opened it.
    expect(document.activeElement).toBe(open)
  })

  it('closes on a link followed, leaving focus on the new page', async () => {
    restore.push(setWide(false))
    const user = userEvent.setup()
    function Routed() {
      const [page, setPage] = useState('a')
      const ref = useRef<HTMLElement>(null)
      useFocusOnChange(page, ref)
      return (
        <ColumnProvider closeOn={page}>
          <Layout>
            <Column side="left" aria-label="Pages">
              <ColumnContent>
                <button type="button" onClick={() => setPage('b')}>
                  Go to b
                </button>
              </ColumnContent>
            </Column>
            <Page>
              <PageHeader>
                <ColumnTrigger side="left" icon="menu" aria-label="Open pages" />
              </PageHeader>
              <PageContent ref={ref}>
                <h1>Page {page}</h1>
              </PageContent>
            </Page>
          </Layout>
        </ColumnProvider>
      )
    }
    render(<Routed />)
    await user.click(screen.getByRole('button', { name: 'Open pages' }))
    await user.click(await screen.findByRole('button', { name: 'Go to b' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Page b' }))
  })

  it('with two, open from the bottom bar, one at a time, a second press closing', async () => {
    restore.push(setWide(false))
    const user = userEvent.setup()
    render(<App />)
    const bar = screen.getByRole('toolbar', { name: 'Columns' })
    const pages = screen.getByRole('button', { name: 'Pages' })
    const details = screen.getByRole('button', { name: 'Details' })
    expect(bar.contains(pages)).toBe(true)
    await user.click(pages)
    expect(await screen.findByRole('dialog', { name: 'Pages' })).toBeTruthy()
    await user.click(details)
    expect(await screen.findByRole('dialog', { name: 'Details' })).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Pages' })).toBeNull())
    await user.click(details)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('a trigger shown at every width (always)', () => {
  function Always({ placement = 'docked' }: { placement?: Placement }) {
    return (
      <ColumnProvider placement={placement}>
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnContent>Left</ColumnContent>
          </Column>
          <Page>
            <PageHeader>
              <ColumnTrigger side="left" icon="menu" aria-label="Open pages" />
              <ColumnTrigger side="right" always aria-label="Details" />
            </PageHeader>
            <PageContent>Body</PageContent>
          </Page>
          <Column side="right" sheet="bottom" aria-label="Details">
            <ColumnContent>
              <button type="button">Inside</button>
            </ColumnContent>
          </Column>
          <ColumnBar>
            <ColumnBarItem side="left" icon="menu">
              Pages
            </ColumnBarItem>
            <ColumnBarItem side="right">More</ColumnBarItem>
          </ColumnBar>
        </Layout>
      </ColumnProvider>
    )
  }

  it('beside the page, hides the column and shows it again at its width, saying which it controls', async () => {
    restore.push(setWide(true))
    const user = userEvent.setup()
    const { container } = render(<Always />)
    // Without `always`, a trigger draws nothing on a wide window.
    expect(screen.queryByRole('button', { name: 'Open pages' })).toBeNull()
    const details = screen.getByRole('complementary', { name: 'Details' }) as HTMLElement
    const trigger = screen.getByRole('button', { name: 'Details' })
    expect(trigger.getAttribute('aria-controls')).toBe(details.id)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
    await expectNoA11yViolations(container)
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(details.firstElementChild?.hasAttribute('inert')).toBe(true)
    expect(details.style.width).toBe('0px')
    // Its splitter goes while it is collapsed: the trigger shows it again.
    expect(screen.queryByRole('separator', { name: 'Resize details' })).toBeNull()
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(details.hasAttribute('inert')).toBe(false)
    expect(details.style.width).toBe('256px')
    // Collapsed from its splitter by Enter, the focus goes to the trigger.
    screen.getByRole('separator', { name: 'Resize details' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('separator', { name: 'Resize details' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
    // The trigger by its keys: Space shows the column, Enter hides it.
    await user.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('over the page, slides the column off its edge and back', async () => {
    restore.push(setWide(true))
    const user = userEvent.setup()
    render(<Always placement="floating" />)
    const details = screen.getByRole('complementary', { name: 'Details' }) as HTMLElement
    const trigger = screen.getByRole('button', { name: 'Details' })
    expect(trigger.getAttribute('aria-controls')).toBe(details.id)
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(details.hasAttribute('inert')).toBe(true)
    expect(details.style.transform).toBe('translateX(100%)')
    await user.click(trigger)
    expect(details.hasAttribute('inert')).toBe(false)
  })

  it('on a narrow window, opens the sheet, and focus goes back to it, not to the bar', async () => {
    restore.push(setWide(false))
    const user = userEvent.setup()
    render(<Always />)
    const header = screen.getByRole('button', { name: 'Details' })
    const bar = screen.getByRole('button', { name: 'More' })
    expect(header.getAttribute('aria-haspopup')).toBe('dialog')
    await user.click(header)
    expect(await screen.findByRole('dialog', { name: 'Details' })).toBeTruthy()
    expect(header.getAttribute('aria-expanded')).toBe('true')
    expect(bar.getAttribute('aria-expanded')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(header)
    // And from the bar, back to the bar.
    await user.click(bar)
    await screen.findByRole('dialog', { name: 'Details' })
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(bar)
  })
})

describe('defaultHidden', () => {
  function Hidden({ placement = 'docked' }: { placement?: Placement }) {
    return (
      <ColumnProvider placement={placement} defaultHidden={['right']}>
        <Layout>
          <Page>
            <PageHeader>
              <ColumnTrigger side="right" always aria-label="Assistant" />
            </PageHeader>
            <PageContent>Body</PageContent>
          </Page>
          <Column side="right" aria-label="Assistant">
            <ColumnContent>Chat</ColumnContent>
          </Column>
        </Layout>
      </ColumnProvider>
    )
  }

  it('starts the side given hidden, beside the page or over it, until its trigger shows it', async () => {
    for (const placement of ['docked', 'floating'] as const) {
      restore.push(setWide(true))
      const user = userEvent.setup()
      const { unmount } = render(<Hidden placement={placement} />)
      const column = screen.getByRole('complementary', { hidden: true, name: 'Assistant' })
      const trigger = screen.getByRole('button', { name: 'Assistant' })
      // Beside the page its contents are inert, the splitter in it kept;
      // over the page the column itself.
      expect((placement === 'docked' ? column.firstElementChild : column)?.hasAttribute('inert')).toBe(true)
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      await user.click(trigger)
      expect(column.hasAttribute('inert')).toBe(false)
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      unmount()
    }
  })
})


describe('drawn on a server, then hydrated', () => {
  // The server cannot know the window's width, so a column is drawn as on a
  // wide window, hidden by CSS below the breakpoint, and the narrow
  // window's trigger and bar hidden by CSS from it: either width's first
  // paint is right before JavaScript runs.
  const parse = (app: ReactElement) => {
    const box = document.createElement('div')
    box.innerHTML = renderToString(app)
    document.body.append(box)
    restore.push(() => box.remove())
    return box
  }
  // React's act outside Testing Library's render, which says so itself.
  const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  /** Hydrates the server's HTML, returning what React reported: a
   *  mismatch between it and the browser's first render among them. */
  const hydrate = async (box: HTMLElement, app: ReactElement) => {
    const was = env.IS_REACT_ACT_ENVIRONMENT
    env.IS_REACT_ACT_ENVIRONMENT = true
    const errors: unknown[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(box, app, { onRecoverableError: (e) => errors.push(e) })
    })
    spy.mockRestore()
    restore.push(() => {
      act(() => root?.unmount())
      env.IS_REACT_ACT_ENVIRONMENT = was
    })
    return errors
  }
  const asides = (box: HTMLElement) => [...box.querySelectorAll('aside')]
  const hiddenNarrow = (el: Element | null | undefined) => el?.classList.contains('max-lg:hidden')
  const hiddenWide = (el: Element | null | undefined) => el?.classList.contains('lg:hidden')
  const bar = (box: HTMLElement) => box.querySelector('nav[aria-label="Columns"]')
  const trigger = (box: HTMLElement) => box.querySelector('[aria-label="Open pages"]')

  for (const placement of ['docked', 'floating'] as const) {
    const two = <App placement={placement} />

    it(`${placement}: has the columns, hidden by CSS on a narrow window, and the bar, hidden by CSS on a wide one`, () => {
      const box = parse(two)
      expect(asides(box).map((a) => a.getAttribute('aria-label'))).toEqual(['Pages', 'Details'])
      expect(asides(box).every(hiddenNarrow)).toBe(true)
      expect(hiddenWide(bar(box))).toBe(true)
    })

    it(`${placement}: hydrates on a wide window without a mismatch, then drops the CSS and the bar`, async () => {
      const box = parse(two)
      restore.push(setWide(true))
      expect(await hydrate(box, two)).toEqual([])
      expect(asides(box).map((a) => a.getAttribute('aria-label'))).toEqual(['Pages', 'Details'])
      expect(asides(box).some(hiddenNarrow)).toBe(false)
      expect(bar(box)).toBeNull()
    })

    it(`${placement}: hydrates on a narrow window without a mismatch, then has the bar and no column on the page`, async () => {
      const box = parse(two)
      restore.push(setWide(false))
      expect(await hydrate(box, two)).toEqual([])
      expect(asides(box)).toEqual([])
      expect(hiddenWide(bar(box))).toBe(false)
    })
  }

  it("has the narrow window's trigger hidden by CSS on a wide one, and after hydrating has it only on a narrow one", async () => {
    const one = <App sides={['left']} />
    expect(hiddenWide(trigger(parse(one)))).toBe(true)
    restore.push(setWide(true))
    const wide = parse(one)
    expect(await hydrate(wide, one)).toEqual([])
    expect(trigger(wide)).toBeNull()
    restore.push(setWide(false))
    const narrow = parse(one)
    expect(await hydrate(narrow, one)).toEqual([])
    expect(hiddenWide(trigger(narrow))).toBe(false)
  })

  it('draws no close button in a column, which has no sheet to close until the window is known', () => {
    const box = parse(
      <ColumnProvider>
        <Layout>
          <Column side="left" aria-label="Pages">
            <ColumnHeader>
              <ColumnClose />
            </ColumnHeader>
          </Column>
        </Layout>
      </ColumnProvider>,
    )
    expect(asides(box)).toHaveLength(1)
    expect(box.querySelector('button')).toBeNull()
  })

  it('drawn in the browser alone, has nothing hidden by CSS', () => {
    restore.push(setWide(true))
    const wide = render(<App />)
    expect(asides(wide.container).some(hiddenNarrow)).toBe(false)
    wide.unmount()
    restore.push(setWide(false))
    const { container } = render(<App />)
    expect(hiddenWide(bar(container))).toBe(false)
  })
})
