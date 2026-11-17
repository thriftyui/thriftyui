import { DialogDemo } from '../examples/dialog-demo'

// The dialog page: which way the bodies slide, and a cell for each
// arrangement that opens the dialog that way.

export function DialogPage() {
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Dialog</h1>
      <p className="text-neutral-11">
        Radix's Dialog with three bodies, arranged as tabs in the header or the footer, a rail down either side, arrows in the header or the footer, or a list.
        Pick one below; Slide sets which way the bodies move. On a phone the dialog fills the screen.
      </p>
      <DialogDemo />
    </div>
  )
}
