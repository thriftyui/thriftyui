import { useRef } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router'
import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { SkipLink } from 'thriftyui/skip-link'
import { useFocusOnChange } from 'thriftyui/use-focus-on-change'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { PAGES } from './routes'
import { useSystemDark } from './use-system-dark'

// The page alone: the name and the navigation in the header, the page's
// content, a footer. With no column, the pages are links in the header;
// on a phone the same.

export default function App() {
  useSystemDark()
  const { pathname } = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  // A link followed moves focus to the new page's heading.
  useFocusOnChange(pathname, contentRef)
  return (
    <>
      <SkipLink href="#main">Skip to content</SkipLink>
      <Layout>
        <Page>
          <PageHeader>
            <span className="self-center px-4 text-sm font-semibold">App</span>
            <nav aria-label="Pages" className="ms-auto flex">
              {PAGES.map((p) => (
                <NavLink
                  key={p.path}
                  to={p.path}
                  end
                  className="flex items-center px-4 text-sm text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-medium aria-[current=page]:text-neutral-12"
                >
                  {p.title}
                </NavLink>
              ))}
            </nav>
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
      </Layout>
    </>
  )
}
