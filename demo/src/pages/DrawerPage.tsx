import type { ReactNode } from 'react'
import type { Arrangement, Slide } from '../examples/arrangements'
import { useSettings, type DrawerSize } from '../settings'
import { SegmentedControl } from 'thriftyui/segmented-control'

// The drawer page: where to find the left column's drawer, and how it
// arranges its bodies -- tabs, arrows or a list, all in the drawer's own
// header, since it rises from the column's footer -- and which way they
// slide, and how tall it rises: one row, half the column, or all the way
// to the column's header. Each a row of cells, one chosen
// (SegmentedControl).

const KINDS: { value: Arrangement; label: string }[] = [
  { value: 'tabs-header', label: 'Tabs' },
  { value: 'arrows-header', label: 'Arrows' },
  { value: 'list', label: 'List' },
]

const SIZES: { value: DrawerSize; label: string }[] = [
  { value: '1', label: '1 row' },
  { value: '3', label: '3 rows' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full' },
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

export function DrawerPage() {
  const { shape, drawer, setDrawer, drawerSlide, setDrawerSlide, drawerSize, setDrawerSize } = useSettings()
  const left = shape === 'left' || shape === 'both'
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Drawer</h1>
      <p className="text-neutral-11">
        The left column has a drawer in its footer. It rises over the column's body, never the page's, with a header of its own. Escape inside it closes it.
      </p>
      {!left && <p className="text-sm text-neutral-11">There is no left column now: turn one on from the Columns page to see the drawer.</p>}
      <Row label="Height">
        <SegmentedControl label="Height" value={drawerSize} options={SIZES} onChange={setDrawerSize} />
      </Row>
      <Row label="Moves between its bodies with">
        <SegmentedControl label="Moves between its bodies with" value={drawer} options={KINDS} onChange={setDrawer} />
      </Row>
      {drawer !== 'list' && (
        <Row label="Slide">
          <SegmentedControl label="Slide" value={drawerSlide} options={SLIDES} onChange={setDrawerSlide} />
        </Row>
      )}
    </div>
  )
}
