import { useRef } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router'
import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { SkipLink } from 'thriftyui/skip-link'
import { useFocusOnChange } from 'thriftyui/use-focus-on-change'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { PAGES, titleOf } from './routes'
import { useSystemDark } from './use-system-dark'
import { Column, ColumnClose, ColumnContent, ColumnFooter, ColumnHeader, ColumnProvider, ColumnTrigger } from 'thriftyui/column'
import { NavItem, NavList } from 'thriftyui/nav-list'

// Navigation on the left, details on the right, beside the page; each
// column's edge is a splitter. Below 1024px the page takes the window and
// the columns open as sheets from the header: the menu at its left opens
// the navigation from the left, the button at its right the details from
// the bottom.

export default function App() {
  useSystemDark()
  const { pathname } = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  // A link followed moves focus to the new page's heading.
  useFocusOnChange(pathname, contentRef)
  return (
    // A link followed closes an open sheet, so the page shows. Columns
    // dragged between 208 and 256 pixels.
    <ColumnProvider placement="docked" closeOn={pathname} minWidth={208} maxWidth={256} defaultWidth={208}>
      <SkipLink href="#main">Skip to content</SkipLink>
      <Layout>
        <Column side="left" aria-label="Pages">
          <ColumnHeader>
            <span className="flex-1 self-center truncate px-3 text-sm font-semibold">App</span>
            <ColumnClose />
          </ColumnHeader>
          <ColumnContent>
            <NavList aria-label="Pages">
              {PAGES.map((p) => (
                <NavItem key={p.path} asChild>
                  <NavLink to={p.path} end>
                    {p.title}
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </ColumnContent>
          <ColumnFooter />
        </Column>
        <Page>
          <PageHeader>
            {/* The menu, on a phone, at the header's left end. */}
            <ColumnTrigger side="left" icon="menu" aria-label="Pages" />
            <span className="flex-1 self-center truncate px-4 text-sm font-semibold max-lg:ps-1">{titleOf(pathname)}</span>
            {/* The details column: collapsed and expanded on a wide window,
                its sheet on a phone. */}
            <ColumnTrigger side="right" always aria-label="Details" />
          </PageHeader>
          <PageContent
            id="main"
            ref={contentRef}
            className="[&_h1]:focus-visible:outline-hidden"
          >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageContent>
          <PageFooter>
            <span className="self-center px-4 text-xs text-neutral-11">App</span>
          </PageFooter>
        </Page>
        <Column side="right" sheet="bottom" aria-label="Details">
          {/* Blank, a header and a footer round an empty body, for the
              app to fill. On a phone its sheet's close
              button stays in the header. */}
          <ColumnHeader>
            <span className="flex-1" />
            <ColumnClose />
          </ColumnHeader>
          <ColumnContent />
          <ColumnFooter />
        </Column>
      </Layout>
    </ColumnProvider>
  )
}
