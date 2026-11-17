# ThriftyUI starter: Floating columns

Two blank columns floating over the page, dragged or placed by a toolbar in the footer, the page a blueprint board. One screen, no pages. On a phone, as two columns.

A skip link to the content; light or dark as the system is; the board in
fixed colours whatever the theme.

    npm install
    npm run dev

## Files

- `src/App.tsx` -- the layout.
- `src/index.css` -- Tailwind, the kit's theme, and the blueprint board. For the kit's other
  themes, add `@import "thriftyui/themes.css";` and set `data-accent`,
  `data-neutral` or `data-radius` on `<html>` (the kit's README).

## In this workspace

It runs from `ThriftyUI/` with `npm run dev -w starters/floating`, on the
kit in `kit/`. Copied out on its own, it needs the kit installed --
`npm install thriftyui` once the kit is published -- and the `@source`
line in `src/index.css` pointed at `../node_modules/thriftyui/dist`.
