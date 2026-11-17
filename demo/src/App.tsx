import { useEffect, useMemo, useRef, useState } from 'react'
import * as Direction from 'radix-ui/direction'
import * as Toggle from 'radix-ui/toggle'
import { Moon } from 'lucide-react'
import { CELL, CELL_ICON } from 'thriftyui/cell'
import { Route, Routes, useLocation } from 'react-router'
import { LeftColumn, PagesMenu, RightColumn } from './app-columns'
import { useFocusOnChange } from 'thriftyui/use-focus-on-change'
import { useMediaQuery, WIDE } from 'thriftyui/use-media-query'
import { SkipLink } from 'thriftyui/skip-link'
import { ColumnBar, ColumnBarItem, ColumnProvider, ColumnToolbar, ColumnTrigger, type Placement } from 'thriftyui/column'
import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { Columns } from './pages/Columns'
import { ComponentsPage } from './pages/ComponentsPage'
import { DialogPage } from './pages/DialogPage'
import { DrawerPage } from './pages/DrawerPage'
import { Overview } from './pages/Overview'
import { ROUTES } from './routes'
import type { Arrangement, Slide } from './examples/arrangements'
import { SettingsContext, type DrawerSize, type Shape } from './settings'
import { setDark } from 'thriftyui/set-dark'

// The app: pages, and a column on the left (the navigation), the right (the
// details), both or neither, chosen on the Columns page. React Router maps
// each address to its page (reactrouter.com, Declarative; React's own
// guide suggests it: react.dev, Build a React app from Scratch, Routing).
//
// On a wide window (1024px up) the columns sit beside the page or over it.
// Below it the page takes the window and the columns open as sheets:
//
//   two columns   a bar along the bottom with one labelled button each, in
//                 the page footer's place; the left slides in from the
//                 left, the right rises from the bottom
//   one column    a button in the page's header, at the column's side: three
//                 lines for the navigation, a column for the details
//   none          nothing to open
//
// With no left column, the pages are a menu in the page's header. Light or
// dark is the one setting for the whole app, in the page's header. Sources:
// README.

function NotFound() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-neutral-11">There is no page at this address.</p>
    </div>
  )
}

function App() {
  const [shape, setShape] = useState<Shape>('both')
  const [placement, setPlacement] = useState<Placement>('docked')
  const [snap, setSnap] = useState(true)
  const [details, setDetails] = useState<Arrangement>('tabs-header')
  const [detailsSlide, setDetailsSlide] = useState<Slide>('horizontal')
  const [drawer, setDrawer] = useState<Arrangement>('tabs-header')
  const [drawerSlide, setDrawerSlide] = useState<Slide>('horizontal')
  const [drawerSize, setDrawerSize] = useState<DrawerSize>('half')
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr')
  const settings = useMemo(
    () => ({
      shape,
      setShape,
      placement,
      setPlacement,
      snap,
      setSnap,
      details,
      setDetails,
      detailsSlide,
      setDetailsSlide,
      drawer,
      setDrawer,
      drawerSlide,
      setDrawerSlide,
      drawerSize,
      setDrawerSize,
      dir,
      setDir,
    }),
    [shape, placement, snap, details, detailsSlide, drawer, drawerSlide, drawerSize, dir],
  )

  // Light or dark: the system's setting until the Dark toggle is pressed,
  // then the person's. Shown by the .dark class on the page's root, which
  // Radix Colors' dark scales and Tailwind's dark variant both use
  // (kit/src/theme.css). index.html sets it before the first paint.
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [chosen, setChosen] = useState<boolean | null>(null)
  const dark = chosen ?? systemDark
  useEffect(() => {
    setDark(dark)
  }, [dark])
  useEffect(() => {
    document.documentElement.dir = dir
  }, [dir])

  const wide = useMediaQuery(WIDE)
  const left = shape === 'left' || shape === 'both'
  const right = shape === 'right' || shape === 'both'
  const sides = [...(left ? ['left' as const] : []), ...(right ? ['right' as const] : [])]
  const over = wide && placement === 'floating' && sides.length > 0
  // The bar along the bottom, on a phone, is floating columns' alone; docked
  // ones open from the header.
  const bar = !wide && left && right && placement === 'floating'

  const { pathname } = useLocation()
  const title = ROUTES.find((r) => r.path === pathname)?.title ?? 'Not found'

  // A link followed moves focus to the new page's heading
  // (kit/src/use-focus-on-change.ts).
  const contentRef = useRef<HTMLElement>(null)
  useFocusOnChange(pathname, contentRef)

  return (
    <SettingsContext.Provider value={settings}>
      <Direction.Provider dir={dir}>
      {/* A link followed closes any open sheet, so the page shows. */}
      <ColumnProvider placement={placement} closeOn={pathname}>
        {/* The first stop: past the header and the columns to the page. */}
        <SkipLink href="#main">Skip to content</SkipLink>
        <Layout>
          {left && <LeftColumn />}
          <Page>
            <PageHeader>
              {/* The left column's menu at the header's left end; the right
                  column's button at its right end. */}
              {left && !bar && <ColumnTrigger side="left" icon="menu" aria-label="Pages" />}
              <span className={`flex-1 self-center truncate px-4 text-sm font-semibold ${left && !bar ? 'max-lg:ps-1' : ''}`}>{title}</span>
              <Toggle.Root pressed={dark} onPressedChange={setChosen} aria-label="Dark" className={CELL}>
                <Moon aria-hidden className={CELL_ICON} strokeWidth={1.75} />
              </Toggle.Root>
              {/* Without a left column, the pages' menu. */}
              {!left && <PagesMenu />}
              {right && !bar && <ColumnTrigger side="right" aria-label="Details" />}
            </PageHeader>
            {/* Focus lands here or on its heading, from the skip link or a
                route change; neither draws a ring round the page. */}
            <PageContent
              id="main"
              ref={contentRef}
              snap={snap}
              className="[&_h1]:focus-visible:outline-hidden"
            >
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/columns" element={<Columns />} />
                <Route path="/dialog" element={<DialogPage />} />
                <Route path="/drawer" element={<DrawerPage />} />
                <Route path="/components" element={<ComponentsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageContent>
            {!bar && (
              <PageFooter className="relative">
                <span className="self-center px-4 text-xs text-neutral-11">ThriftyUI</span>
                {/* The middle half of the footer, whatever is at its ends. */}
                {over && <ColumnToolbar sides={sides} className="absolute inset-y-0 right-1/4 left-1/4" />}
              </PageFooter>
            )}
          </Page>
          {right && <RightColumn />}
          {bar && (
            <ColumnBar>
              <ColumnBarItem side="left" icon="menu">
                Pages
              </ColumnBarItem>
              <ColumnBarItem side="right">Details</ColumnBarItem>
            </ColumnBar>
          )}
        </Layout>
      </ColumnProvider>
      </Direction.Provider>
    </SettingsContext.Provider>
  )
}

export default App
