# thriftyui (the kit)

The package `thriftyui`: React components on Radix Primitives and Radix
Colors, styled with Tailwind CSS 4. This file loads when Claude opens a
file in `kit/`; it is the kit's contract for building it. How an app uses
the kit: `README.md`. Where to check what the kit stands on:
`.claude/rules/sources.md`.

It travels with the kit: an app made by Thrifty Builder has the kit in
its own `kit/`, this file with it. Building the app itself is the app's
rules' (its `CLAUDE.md` and the `thriftyui` skill).

## Stack

React 19, `radix-ui` (Radix Primitives), `@radix-ui/colors`, Tailwind CSS
4, `lucide-react`, `tailwind-merge`; TypeScript strict; Vitest with
Testing Library and axe-core in jsdom. `react-markdown` and `remark-gfm`
are optional peers, for `thriftyui/markdown` only.

## The contract

- **Radix first.** A part with a Radix primitive wraps it, under flat
  names (`Dialog`, `DialogContent`), and passes its props on; the kit
  does not reimplement what Radix gives. A part Radix lacks follows the
  W3C's ARIA Authoring Practices pattern for it, and its comment names
  the pattern.
- **Every claim from a maker's source**, read before it is used and filed
  in the project's research/ beside the kit file built from it
  (`.claude/rules/sources.md`). The kit is its own: nothing of another
  project is a source (`src/vocabulary.test.ts`).
- **Comments short, for a reader new to the kit.** They ship in the
  package and in every app's copy of the kit. A doc comment (`/** */`,
  TSDoc's form) on each export says what it is and how to use it, in a
  line or two; a `//` comment only where the why cannot be seen in the
  code. A standard may be named in a few words ("the W3C's Tree View
  pattern", "WCAG 1.4.1"); its address and its words are not quoted --
  they live in research/. Never in a comment: who asked for something or
  when, the date of a check, an app or site the part was made for, or a
  file that does not ship with the kit (`src/comments.test.ts`).
- **Colours as semantic scales** -- `neutral`, `accent`, `danger`, `success`,
  `warning`, 12 steps each (`src/theme.css`). Never a fixed colour. Where
  WCAG asks 3:1 (focus rings, a control's edge, a state), the steps in
  `theme.css`'s note: rings accent 11, edges and tracks neutral 9, what
  is chosen or filled accent 12.
- **Motion behind `motion-safe:`** wherever a state starts it
  (`src/motion.test.ts`): `motion-reduce:` loses to a `data-[state]:`
  selector.
- **A part's className wins** over its own (`cn`, last).
- **Public API is `package.json` "exports"**: each file is an entry,
  except `./drawer-host`, mapped to null (`src/exports.test.ts`). Every
  component file starts with `'use client'`; the class lists and helpers
  do not.
- **Nothing speculative.** A prop or part stays only if something real
  needs it or a maker's doc calls for it.

## Checks

1. `npm test -w kit`, `npm run typecheck`, `npm run lint`,
   `npm run build`.
2. The part seen working where the kit is shown: in the ThriftyUI
   repository, its page on the site (`web/`); in an app, the kit's
   playground (`kit/playground/`, Thrifty Builder's Preview, Kit). In
   headless Chrome or the Preview: what it does when pressed and keyed.
3. axe-core there, light, dark and at a phone's width; keys as its docs
   list them. No "works" before all three have been seen.

## Layout

- `src/<part>.tsx` -- one entry per part; `src/index.ts` the root.
- `src/theme.css`, `src/themes.css` -- the colours, sizes and motion.
- `src/cell.ts`, `button-class.ts`, `menu-class.ts`, `surface.ts`, `cn.ts`
  -- the class lists and helpers the parts share.
- `src/test/a11y.ts` -- the axe helper; `*.test.ts(x)` beside the parts.
