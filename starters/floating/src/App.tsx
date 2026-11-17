import { Column, ColumnBar, ColumnBarItem, ColumnClose, ColumnContent, ColumnFooter, ColumnHeader, ColumnProvider, ColumnToolbar } from 'thriftyui/column'
import { Layout, Page, PageContent, PageFooter, PageHeader } from 'thriftyui/page'
import { SkipLink } from 'thriftyui/skip-link'
import { useMediaQuery, WIDE } from 'thriftyui/use-media-query'
import { useSystemDark } from './use-system-dark'

// Floating columns: two columns float over the page, between its header and
// footer: dragged by an edge, or placed by the toolbar in the footer (reset,
// flip, align, hide). One screen, no pages: the page is a blueprint board
// (index.css), the columns blank -- a header and a footer round an empty body
// each -- for the app to fill. Below 1024px, as two columns: sheets from the
// bar along the bottom.

/** A blank column: a header (with its close button, on a phone) and a
 *  footer round an empty body. */
function BlankColumn({ side, label }: { side: 'left' | 'right'; label: string }) {
  return (
    <Column side={side} sheet={side === 'right' ? 'bottom' : 'side'} aria-label={label}>
      <ColumnHeader>
        <span className="flex-1" />
        <ColumnClose />
      </ColumnHeader>
      <ColumnContent />
      <ColumnFooter />
    </Column>
  )
}

export default function App() {
  useSystemDark()
  const wide = useMediaQuery(WIDE)
  return (
    // Columns dragged between 208 and 256 pixels.
    <ColumnProvider placement="floating" minWidth={208} maxWidth={256} defaultWidth={208}>
      <SkipLink href="#main">Skip to content</SkipLink>
      <Layout>
        <BlankColumn side="left" label="Left column" />
        <Page>
          <PageHeader>
            <span className="flex-1 self-center truncate px-4 text-sm font-semibold">App</span>
          </PageHeader>
          <PageContent id="main" className="blueprint">
            {/* The page's name for a screen reader; the board shows nothing
                else. */}
            <h1 className="sr-only">App</h1>
          </PageContent>
          {wide && (
            <PageFooter className="relative">
              <span className="self-center px-4 text-xs text-neutral-11">App</span>
              {/* The middle half of the footer. */}
              <ColumnToolbar sides={['left', 'right']} className="absolute inset-y-0 right-1/4 left-1/4" />
            </PageFooter>
          )}
        </Page>
        <BlankColumn side="right" label="Right column" />
        <ColumnBar>
          <ColumnBarItem side="left" icon="menu">
            Left
          </ColumnBarItem>
          <ColumnBarItem side="right">Right</ColumnBarItem>
        </ColumnBar>
      </Layout>
    </ColumnProvider>
  )
}
