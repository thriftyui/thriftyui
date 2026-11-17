import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/a11y.ts'
import { Steady } from './steady.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs.tsx'

const ITEMS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
]

describe('Steady', () => {
  it('holds the word, and its bold copy as generated content kept from screen readers', () => {
    render(<Steady>Images</Steady>)
    const word = screen.getByText('Images')
    expect(word.getAttribute('data-text')).toBe('Images')
    // The copy: ::after with the attribute's text, hidden (visibility), no height.
    for (const c of ['inline-grid', 'after:content-[attr(data-text)]', 'after:invisible', 'after:h-0', 'after:font-semibold']) expect(word.className).toContain(c)
  })
})

describe('TabsTrigger', () => {
  it('puts plain words through Steady, the tab named by the words alone', async () => {
    const { container } = render(
      <Tabs items={ITEMS} defaultValue="one">
        <TabsList aria-label="Pick">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>,
    )
    const two = screen.getByRole('tab', { name: 'Two' })
    expect(two.querySelector('[data-text="Two"]')).not.toBeNull()
    await userEvent.click(two)
    expect(two.getAttribute('aria-selected')).toBe('true')
    await expectNoA11yViolations(container)
  })

  it('leaves anything but plain words as it is', () => {
    render(
      <Tabs items={ITEMS} defaultValue="one">
        <TabsList aria-label="Pick">
          <TabsTrigger value="one">
            <span>One</span>
          </TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: 'One' }).querySelector('[data-text]')).toBeNull()
  })
})
