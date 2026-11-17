import * as Toggle from 'radix-ui/toggle'
import { PageSection } from 'thriftyui/page'
import { GROUP, GROUP_CELL } from 'thriftyui/cell'
import { useSettings } from '../settings'

// The first page: what the prototype has, in sections the page snaps to
// as it scrolls, with the Snap toggle to turn that on or off (Radix's
// Toggle; PageContent's `snap`, kit/src/page.tsx).

const SECTIONS = [
  { title: 'ThriftyUI', text: 'A page, with a column on either side of it, both, or neither: beside it, or over it. Scroll, and the page comes to rest at the start of each section.' },
  { title: 'Columns', text: 'Beside the page, a column is resized by dragging its edge. Over it, a column is moved by dragging, or by the toolbar in the footer. Below 1024px, each opens as a sheet; with two, from a bar along the bottom.' },
  { title: 'Dialog', text: 'A dialog with three bodies, arranged as tabs, a rail, arrows or a list, sliding sideways or up and down. On a phone it fills the screen.' },
  { title: 'Drawer', text: "The left column's drawer rises from its footer, with a header of its own for the tabs, the arrows or the list." },
]

export function Overview() {
  const { snap, setSnap } = useSettings()
  return (
    <>
      {SECTIONS.map((sec, i) => (
        <PageSection key={sec.title} aria-labelledby={`section-${i}`} className="min-h-full border-b border-neutral-6 last:border-b-0">
          <div className="mx-auto max-w-prose px-6 py-16">
            {i === 0 ? (
              <h1 id={`section-${i}`} className="text-3xl font-semibold tracking-tight">
                {sec.title}
              </h1>
            ) : (
              <h2 id={`section-${i}`} className="text-2xl font-semibold tracking-tight">
                {sec.title}
              </h2>
            )}
            <p className="mt-3 text-neutral-11">{sec.text}</p>
            {i === 0 && (
              // One cell on the groups' light ground (kit/src/cell.ts).
              <div className={`${GROUP} mt-6 w-fit`}>
                <Toggle.Root pressed={snap} onPressedChange={setSnap} className={GROUP_CELL}>
                  Snap to sections
                </Toggle.Root>
              </div>
            )}
          </div>
        </PageSection>
      ))}
    </>
  )
}
