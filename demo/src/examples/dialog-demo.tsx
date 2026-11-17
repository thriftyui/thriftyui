import { useRef, useState } from 'react'
import * as VisuallyHidden from 'radix-ui/visually-hidden'
import { X } from 'lucide-react'
import { ButtonGroup, ButtonGroupItem } from 'thriftyui/button-group'
import { CELL, CELL_ICON } from 'thriftyui/cell'
import { Dialog, DialogClose, DialogContent, DialogTitle, type DialogSize } from 'thriftyui/dialog'
import { SegmentedControl } from 'thriftyui/segmented-control'
import { Arranged, type Arrangement, type Slide } from './arrangements'

// The dialog page's controls and the dialog. How big it is and which way
// its bodies slide are rows of cells, one chosen; each arrangement is a
// cell in a group of its kind that opens the dialog that way (ButtonGroup:
// simple cells with text, not a dropdown). The dialog is the kit's (kit/src/dialog.tsx,
// Radix's Dialog), with three bodies arranged in its header, body and
// footer the way chosen (arrangements.tsx). Closing it gives focus back
// to the cell that opened it.

function Close() {
  return (
    <DialogClose aria-label="Close" className={CELL}>
      <X aria-hidden className={CELL_ICON} strokeWidth={1.75} />
    </DialogClose>
  )
}

/** The dialog's name: drawn in its header unless the arrangement puts
 *  something else there, and always its accessible title (radix-ui.com,
 *  Dialog, Title). */
function title(hidden: boolean) {
  const t = <DialogTitle className="flex-none truncate px-3">Dialog</DialogTitle>
  return hidden ? <VisuallyHidden.Root asChild>{t}</VisuallyHidden.Root> : t
}

const GROUPS: { label: string; items: { value: Arrangement; label: string }[] }[] = [
  { label: 'Tabs', items: [{ value: 'tabs-header', label: 'In the header' }, { value: 'tabs-footer', label: 'In the footer' }] },
  { label: 'Rail', items: [{ value: 'rail-left', label: 'On the left' }, { value: 'rail-right', label: 'On the right' }] },
  { label: 'Arrows', items: [{ value: 'arrows-header', label: 'In the header' }, { value: 'arrows-footer', label: 'In the footer' }] },
  { label: 'List', items: [{ value: 'list', label: 'List and detail' }] },
]

const SIZES: { value: DialogSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
  { value: 'full', label: 'Full' },
]

const SLIDES: { value: Slide; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

export function DialogDemo() {
  const [way, setWay] = useState<Arrangement>('tabs-header')
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<DialogSize>('md')
  const [slide, setSlide] = useState<Slide>('horizontal')
  // The cell that opened the dialog, to give focus back to.
  const opener = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Size</span>
        <SegmentedControl label="Size" value={size} options={SIZES} onChange={setSize} />
        <p className="text-sm text-neutral-11">From 1024px wide; on a phone a dialog fills the screen.</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Slide</span>
        <SegmentedControl label="Slide" value={slide} options={SLIDES} onChange={setSlide} />
      </div>
      {GROUPS.map((g) => (
        <div key={g.label} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{g.label}</span>
          <ButtonGroup aria-label={`Open the dialog with ${g.label.toLowerCase()}`}>
            {g.items.map((it) => (
              <ButtonGroupItem
                key={it.value}
                onClick={(e) => {
                  opener.current = e.currentTarget
                  setWay(it.value)
                  setOpen(true)
                }}
              >
                {it.label}
              </ButtonGroupItem>
            ))}
          </ButtonGroup>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size={size}
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            opener.current?.focus()
          }}
        >
          <Arranged key={way} way={way} title={title} end={<Close />} slide={slide} />
        </DialogContent>
      </Dialog>
    </>
  )
}
