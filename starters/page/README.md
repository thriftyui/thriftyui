# ThriftyUI starter: Header navigation

The page alone: a header with the navigation, the content, a footer. The same on a phone.

Two pages, Home and About, with React Router; a skip link to the content;
focus moved to the new page's heading when a link is followed; light or
dark as the system is.

    npm install
    npm run dev

## Files

- `src/App.tsx` -- the layout and the routes.
- `src/routes.ts` -- the pages, in the navigation's order.
- `src/pages/` -- one file per page.
- `src/index.css` -- Tailwind and the kit's theme. For the kit's other
  themes, add `@import "thriftyui/themes.css";` and set `data-accent`,
  `data-neutral` or `data-radius` on `<html>` (the kit's README).

## In this workspace

It runs from `ThriftyUI/` with `npm run dev -w starters/page`, on the
kit in `kit/`. Copied out on its own, it needs the kit installed --
`npm install thriftyui` once the kit is published -- and the `@source`
line in `src/index.css` pointed at `../node_modules/thriftyui/dist`.
