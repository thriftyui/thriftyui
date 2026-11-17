'use client'

import { useRef, useState, type ComponentProps } from 'react'
import * as DialogPrimitive from 'radix-ui/dialog'
import { X } from 'lucide-react'
import { buttonClass } from './button-class.ts'
import { cn } from './cn.ts'
import { usePortalContainer } from './portal-container.tsx'
import { focusAfterPress } from './input-modality.ts'

// Each image's `alt` names its button. The open image's title is for a
// screen reader only; a Close button, shown when reached by keyboard, is
// its first stop.

/** An image of a Gallery: where it is, and what it shows in words, which
 *  names its button. */
export interface GalleryImage {
  src: string
  /** What the image shows, in words. */
  alt: string
}

/** A grid of images, each a square button that opens it whole over the
 *  dimmed page (Radix's Dialog), a press anywhere closing it. Its columns
 *  follow the box it is in: one, two or four. Named "Images" unless given
 *  `label`; `empty` shows when there are none. */
export function Gallery({
  images,
  label = 'Images',
  empty = 'No images yet',
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & {
  images: GalleryImage[]
  /** Names the grid.
   *  @defaultValue `'Images'` */
  label?: string
  /** Shown when there are no images.
   *  @defaultValue `'No images yet'` */
  empty?: string
}) {
  // The image open, kept while it fades out after closing.
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState<GalleryImage | null>(null)
  // The thumbnail pressed, for focus to go back to: Radix returns focus to
  // its Trigger, and the thumbnails are not one.
  const opener = useRef<HTMLButtonElement | null>(null)
  const container = usePortalContainer()
  return (
    <div className={cn('@container', className)} {...props}>
      {images.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-11">{empty}</p>
      ) : (
        <ul aria-label={label} className="grid grid-cols-1 gap-2 @sm:grid-cols-2 @2xl:grid-cols-4">
          {images.map((image) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={(e) => {
                  opener.current = e.currentTarget
                  setShown(image)
                  setOpen(true)
                }}
                className="group block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border border-neutral-6 bg-neutral-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="size-full object-cover motion-safe:duration-200 group-hover:scale-105 motion-safe:transition-transform"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal container={container}>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[65] bg-overlay backdrop-blur-md data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in" />
          {shown && (
            <DialogPrimitive.Content
              aria-describedby={undefined}
              onClick={() => setOpen(false)}
              onCloseAutoFocus={(e) => {
                e.preventDefault()
                if (opener.current) focusAfterPress(opener.current)
              }}
              className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center p-4 focus-visible:outline-hidden data-[state=closed]:motion-safe:animate-fade-out data-[state=open]:motion-safe:animate-fade-in"
            >
              <DialogPrimitive.Title className="sr-only">{shown.alt}</DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Close"
                className={buttonClass('default', 'icon', 'absolute end-4 top-[calc(1rem+env(safe-area-inset-top))] not-focus-visible:sr-only')}
              >
                <X aria-hidden />
              </DialogPrimitive.Close>
              <img src={shown.src} alt={shown.alt} className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-(--overlay-shadow)" />
            </DialogPrimitive.Content>
          )}
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
