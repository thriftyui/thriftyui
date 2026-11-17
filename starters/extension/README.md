# ThriftyUI starter: Extension

A blank Chrome extension built from ThriftyUI: one page, shown in the
toolbar's popup and in the browser's side panel -- a header with its
name, an empty content, a footer. Light or dark as the system is.

    npm install
    npm run build

Then in Chrome: `chrome://extensions`, turn on Developer mode, Load
unpacked, and pick this folder's `dist`. Chrome 116 or later.

## Files

- `public/manifest.json` -- what Chrome reads: the popup, the side panel,
  and the one permission, `sidePanel`.
- `popup.html`, `sidepanel.html` and `src/popup.tsx`, `src/sidepanel.tsx`
  -- one page each.
- `src/Surface.tsx` -- the page both show.
- `public/first-theme.js` -- light or dark before the first paint, a file
  of its own, as an extension page runs no inline script (Chrome's
  content security policy for extension pages).
- `src/index.css` -- Tailwind, the kit's theme, and the popup's size.

## In this workspace

It builds from `ThriftyUI/` with `npm run build -w starters/extension`, on
the kit in `kit/`. Copied out on its own, it needs the kit installed --
`npm install thriftyui` once the kit is published -- and the `@source`
line in `src/index.css` pointed at `../node_modules/thriftyui/dist`.
