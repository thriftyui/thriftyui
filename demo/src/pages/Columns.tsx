import type { ReactNode } from 'react'
import { useMediaQuery, WIDE } from 'thriftyui/use-media-query'
import type { Arrangement, Slide } from '../examples/arrangements'
import type { Placement } from 'thriftyui/column'
import { useSettings, type Shape } from '../settings'
import { SegmentedControl } from 'thriftyui/segmented-control'

// The columns page: which columns there are, on a wide window whether they
// sit beside the page or over it, and how the details column (the right)
// arranges its bodies -- tabs or arrows in its header or footer, or a
// list -- and which way they slide. Each a row of cells, one chosen
// (SegmentedControl).

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'page', label: 'None' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
]

const PLACEMENTS: { value: Placement; label: string }[] = [
  { value: 'docked', label: 'Docked' },
  { value: 'floating', label: 'Floating' },
]

type Kind = 'tabs' | 'arrows' | 'list'
const KINDS: { value: Kind; label: string }[] = [
  { value: 'tabs', label: 'Tabs' },
  { value: 'arrows', label: 'Arrows' },
  { value: 'list', label: 'List' },
]
type Where = 'header' | 'footer'
const WHERES: { value: Where; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
]
const SLIDES: { value: Slide; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}

export function Columns() {
  const { shape, setShape, placement, setPlacement, details, setDetails, detailsSlide, setDetailsSlide } = useSettings()
  const right = shape === 'right' || shape === 'both'
  // The arrangement as its two halves: what moves between the bodies, and
  // where it sits.
  const kind: Kind = details === 'list' ? 'list' : details.startsWith('arrows') ? 'arrows' : 'tabs'
  const where: Where = details.endsWith('footer') ? 'footer' : 'header'
  const arrange = (k: Kind, w: Where) => setDetails(k === 'list' ? 'list' : (`${k}-${w}` as Arrangement))
  const wide = useMediaQuery(WIDE)
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Columns</h1>
      <p className="text-neutral-11">
        A column on either side of the page, both, or none. The left one holds the navigation, so with no left column it moves to a menu in the page's header.
      </p>
      <Row label="Columns">
        <SegmentedControl label="Columns" value={shape} options={SHAPES} onChange={setShape} />
      </Row>
      {wide ? (
        <Row label="Placement">
          <SegmentedControl label="Placement" value={placement} options={PLACEMENTS} onChange={setPlacement} />
          <p className="text-sm text-neutral-11">
            Beside: drag a column's edge to resize it. Over: drag a column by its edge to move it, or use the toolbar in the page's footer.
          </p>
        </Row>
      ) : (
        <p className="text-sm text-neutral-11">
          On a narrow screen the columns open as sheets: with two, from the bar along the bottom; with one, from the button in the page's header.
        </p>
      )}
      {right && (
        <>
          <h2 className="pt-4 text-xl font-semibold tracking-tight">Details column</h2>
          <Row label="Moves between its bodies with">
            <SegmentedControl label="Moves between its bodies with" value={kind} options={KINDS} onChange={(k) => arrange(k, where)} />
          </Row>
          {kind !== 'list' && (
            <>
              <Row label="In its">
                <SegmentedControl label="In its" value={where} options={WHERES} onChange={(w) => arrange(kind, w)} />
              </Row>
              <Row label="Slide">
                <SegmentedControl label="Slide" value={detailsSlide} options={SLIDES} onChange={setDetailsSlide} />
              </Row>
            </>
          )}
        </>
      )}
    </div>
  )
}
