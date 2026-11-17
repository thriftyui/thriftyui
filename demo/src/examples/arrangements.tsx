import type { ReactNode } from 'react'
import { ListDetail, ListDetailBack, ListDetailContent, ListDetailItem, ListDetailList, ListDetailTitle } from 'thriftyui/list-detail'
import { BAR } from 'thriftyui/cell'
import { Tabs, TabsCurrent, TabsList, TabsNext, TabsPrevious, TabsSlide, TabsSlides, TabsTrigger } from 'thriftyui/tabs'

// Three bodies, arranged four ways, for any place with a header, a body and a
// footer -- the dialog (dialog-demo.tsx) and the right column (App.tsx) both
// use these:
//
//   Tabs     the tab list in the header or the footer
//   Rail     the tab list down the left or right side (Radix's Tabs,
//            orientation="vertical")
//   Arrows   previous, the body's name, next, in the header or the footer
//            (TabsPrevious, TabsCurrent, TabsNext, kit/src/tabs.tsx)
//   List     the list first, a body in its place with Back
//            (ListDetail, kit/src/list-detail.tsx)
//
// The place supplies its title (`title`, drawn or visually hidden) and what goes at the
// header's end (`end`: a close button, a menu). Nothing here knows which place it is in.
// Not every place offers every arrangement: the dialog has all four; a column has no rail;
// a column's drawer has only those in its header, since it rises from the column's footer.
// The choices are made on the pages (Dialog, Columns, Drawer). When the tab changes, the
// bodies slide into place, sideways or up and down (`slide`, TabsSlides in
// kit/src/tabs.tsx); the list keeps its own back and forth.

export type Slide = 'horizontal' | 'vertical'

export type Arrangement = 'tabs-header' | 'tabs-footer' | 'rail-left' | 'rail-right' | 'arrows-header' | 'arrows-footer' | 'list'

const ITEMS = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
]


const bar = 'flex shrink-0 items-stretch border-neutral-6'
const headerBar = `${bar} h-(--header-height) border-b`
const footerBar = `${bar} h-(--footer-height) border-t`

/** A body: a placeholder, the same in every arrangement. */
function Body({ label }: { label: string }) {
  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="mt-2 text-sm text-neutral-11">The {label.toLowerCase()} body, and nothing in it yet.</p>
    </div>
  )
}

const trigger =
  'min-w-0 truncate px-2 text-xs text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=active]:font-semibold data-[state=active]:text-accent-12'

function TabRow() {
  return (
    <TabsList aria-label="Bodies" className={`${BAR} min-w-0 flex-1`}>
      {ITEMS.map((i) => (
        <TabsTrigger key={i.value} value={i.value} className={trigger}>
          {i.label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

/** The three bodies. With no tab list (the arrows), a body is not a
 *  tab panel: Radix labels each tab panel by its tab (aria-labelledby, its
 *  source, tabs.tsx), which would point at nothing, so each is a region
 *  named for itself instead; Radix lets the props given win over its own. */
function Bodies({ untabbed, slide, body = (label) => <Body label={label} /> }: { untabbed?: boolean; slide: Slide; body?: (label: string) => ReactNode }) {
  return (
    <TabsSlides orientation={slide}>
      {ITEMS.map((i) => (
        <TabsSlide
          key={i.value}
          value={i.value}
          {...(untabbed ? { role: 'region', 'aria-labelledby': undefined, 'aria-label': i.label } : {})}
          className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        >
          {body(i.label)}
        </TabsSlide>
      ))}
    </TabsSlides>
  )
}

/** The arrangement, filling the place's header, body and footer.
 *  `title(hidden)` draws the place's name; `end` goes at the header's end;
 *  `slide`, which way the bodies slide when the tab changes; `body`, what
 *  each body holds (by default a heading and a line). */
export function Arranged({
  way,
  title,
  end,
  slide = 'horizontal',
  body,
}: {
  way: Arrangement
  title: (hidden: boolean) => ReactNode
  end?: ReactNode
  slide?: Slide
  body?: (label: string) => ReactNode
}): ReactNode {
  const plainHeader = (
    <div className={headerBar}>
      {title(false)}
      <div className="ml-auto flex">{end}</div>
    </div>
  )
  if (way === 'tabs-header' || way === 'tabs-footer' || way === 'arrows-header' || way === 'arrows-footer') {
    const tabs = way.startsWith('tabs')
    const inHeader = way.endsWith('header')
    const nav = tabs ? (
      <TabRow />
    ) : (
      <>
        <TabsPrevious />
        <TabsCurrent />
        <TabsNext />
      </>
    )
    return (
      <Tabs items={ITEMS} className="flex min-h-0 flex-1 flex-col">
        {inHeader ? (
          <>
            {title(true)}
            <div className={headerBar}>
              {nav}
              {end}
            </div>
          </>
        ) : (
          plainHeader
        )}
        <Bodies untabbed={!tabs} slide={slide} body={body} />
        {!inHeader && <div className={footerBar}>{nav}</div>}
      </Tabs>
    )
  }
  if (way === 'rail-left' || way === 'rail-right') {
    return (
      <Tabs items={ITEMS} orientation="vertical" className="flex min-h-0 flex-1 flex-col">
        {plainHeader}
        <div className={`flex min-h-0 flex-1 ${way === 'rail-right' ? 'flex-row-reverse' : ''}`}>
          <TabsList aria-label="Bodies" className={`flex w-24 shrink-0 flex-col border-neutral-6 ${way === 'rail-left' ? 'border-r' : 'border-l'}`}>
            {ITEMS.map((i) => (
              <TabsTrigger
                key={i.value}
                value={i.value}
                className="px-3 py-3 text-left text-xs hover:text-neutral-12 text-neutral-11 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus data-[state=active]:bg-neutral-5 data-[state=active]:font-semibold data-[state=active]:text-neutral-12"
              >
                {i.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Bodies slide={slide} body={body} />
        </div>
      </Tabs>
    )
  }
  return (
    <ListDetail>
      {title(true)}
      <div className={headerBar}>
        <ListDetailBack />
        <ListDetailTitle>{title(false)}</ListDetailTitle>
        <div className="ml-auto flex">{end}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ListDetailList aria-label="Bodies">
          {ITEMS.map((i) => (
            <ListDetailItem key={i.value} value={i.value}>
              {i.label}
            </ListDetailItem>
          ))}
        </ListDetailList>
        {ITEMS.map((i) => (
          <ListDetailContent key={i.value} value={i.value}>
            {body ? body(i.label) : <Body label={i.label} />}
          </ListDetailContent>
        ))}
      </div>
    </ListDetail>
  )
}
