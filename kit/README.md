# thriftyui

React components on Radix Primitives and Radix Colors, styled with
Tailwind CSS 4. Light and dark, any Radix Colors scale as the accent or
the neutral, one corner setting, right-to-left.

Needs React 19 and Tailwind CSS 4.3 or later in the app. Browsers: those
Tailwind 4 needs -- Chrome 111, Safari 16.4, Firefox 128
(tailwindcss.com, Compatibility, "Browser support").

## Set up

The app's stylesheet imports Tailwind, then the kit's theme, and tells
Tailwind to read the kit's files, which it otherwise skips in
`node_modules` (tailwindcss.com, Detecting classes in source files,
"Explicitly registering sources"):

```css
@import "tailwindcss";
@import "thriftyui/theme.css";
@source "../node_modules/thriftyui/dist";
```

The `@source` path is from the stylesheet to the package.

## Use

Each component is its own entry, or all from the root:

```tsx
import { Button } from 'thriftyui/button'
import { Dialog, DialogContent, DialogTrigger } from 'thriftyui/dialog'
import { Combobox } from 'thriftyui'
```

Every component file starts with `"use client"`, as Radix's do, so the
kit works in React Server Component apps: a server component uses its
parts directly, and its plain functions (`cn`, `listDate`) run on the
server. Rendered on a server, the columns are drawn as on a wide window
and hidden by CSS below 1024px, so the page's first paint is right at
any width before its JavaScript runs.

The entries: accordion, alert-dialog, approval-card, aspect-ratio (and
AccessibleIcon), avatar, badge, bank-card (a plate the shape of a bank
card, and Guilloche), breadcrumb, button, button-group, calendar,
callout, card, chat, checkbox, collapsible, column and column-drawer
(the columns beside or over a page, sheets on a phone, a bottom one
dragged down to close), combobox, command (and CommandDialog),
context-menu, data-table, date-picker, diff, dialog and dialog-drawer
(its header and footer, a drawer rising from the footer), dropdown-menu,
empty, feed (and AutoFeed), field (a label, a control, a description and
an error, wired together), form, gallery, hover-card, input,
input-group, kbd, knob, label, list-detail, markdown (with
react-markdown and remark-gfm installed), menubar, meter, nav-bar (a
phone's bar of an app's sections), nav-list, navigation-menu,
number-field, one-time-password-field, page (Layout, Page and its
header, content, footer), pagination, password-toggle-field, popover,
progress, radio-group, resizable, rolling-number, rolling-text,
scroll-area, segmented-control, select, separator, sheet (from the
bottom, dragged to close and between heights), skeleton, skip-link,
slider, sparkline, spinner, switch, table, tabs, textarea, tips, toast,
todo-list, toggle, toggle-group, tool-call, toolbar, tooltip, tree (the
W3C's Tree View), typography (Heading, Text, Link, Code, CodeBlock,
Blockquote), video, wheel; the hooks use-focus-on-change,
use-media-query and use-pan-zoom (zoom and move something bigger than
its box); the helpers command-match, date (startOfDay, sameDay,
listDate), page-range, portal-container and steady (words that keep
their bold width, which the tabs use for their words); and the class
lists the parts share: cell, button-class, menu-class, surface, and
`cn`.

## Chat

`thriftyui/chat` is an assistant's conversation, drawn from what the app
gives it: `Conversation` (a named log, busy while a reply streams, so a
screen reader hears the reply once, whole), `Message`, `Pending`,
`Sources` (an answer's citations, numbered), `Suggestions`, `AiNotice`
(the line that says an AI is answering) and `Composer` (the message box:
Enter sends, Shift+Enter a new line, Stop while a reply comes; with
`commands`, a "/" menu, matched by `thriftyui/command-match`). It calls
no model: the app's server does, with its key.

For an assistant that works -- reads files, runs commands -- each part
its own entry: `ToolCall` (a line saying what it did, opening to its
detail), `Diff` (an edit's lines, removed and added), `TodoList` (its
to-do list, each item's state a shape and a word) and `ApprovalCard`
(asking before it acts: Allow, Always allow, Deny).

Replies in Markdown come from `thriftyui/markdown`, an entry of its own
(not in the root), whose two packages the app installs only if it uses
it:

```sh
npm install react-markdown remark-gfm
```

HTML in a reply is escaped, and unsafe links go nowhere (react-markdown's
defaults). `linkAs` on `Markdown` and `Sources` draws their links with the
app's router, so following one keeps the conversation.

## Theme

Colours are semantic scales, Radix Colors' "semantic aliases" (its
Aliasing page): `neutral`, `accent`, `danger`, `success`, `warning`, each 12 steps
(`bg-neutral-2`, `text-accent-12`, `bg-danger-9`). By default neutral is
Radix's gray, the accent blue, danger red, success green, warning yellow.

- **Dark**: the `dark` class on the root (or any part). Radix Colors'
  dark scales and Tailwind's `dark:` both follow it. Switched while the
  page is open, `setDark(dark)` (`thriftyui/set-dark`) sets it with every
  transition held off for that moment, so the page changes at once. On a page rendered
  on a server, a script in the head sets it before the first paint, and
  `suppressHydrationWarning` on `<html>` tells React the class the server
  did not send is expected (react.dev, Common components,
  `suppressHydrationWarning`).
- **Any Radix scale**: import the presets and set attributes, on the root
  or any part:

  ```css
  @import "thriftyui/themes.css";
  ```
  ```html
  <html data-accent="indigo" data-neutral="slate">
  ```

  Accents: amber, blue, bronze, brown, crimson, cyan, gold, grass, green,
  indigo, iris, jade, lime, mint, orange, pink, plum, purple, red, ruby,
  sky, teal, tomato, violet, yellow, gray. Neutrals: gray, mauve, slate,
  sage, olive, sand. `data-success` and `data-warning` take any accent;
  `data-danger` the 16 that keep its text at 4.5:1 over every neutral
  (listed in `themes.css`). Text meets WCAG AA contrast (4.5:1) in light
  and dark: every accent with gray and every neutral with blue checked by
  axe in Chrome over the kit's components, and the colour pairs the kit
  uses computed for all 150 combinations from Radix Colors' values. What
  shows a control and its state -- focus rings, the edges of fields,
  checkboxes and radios, tracks, a chosen radio, a bar's fill -- is 3:1 or
  more against what is next to it (WCAG 2.2, 1.4.11 Non-text Contrast),
  over the same 150; the steps it takes are in `theme.css`. An app with
  one fixed theme can skip the presets and point the aliases at its scale
  in its own CSS.
- **Or Tailwind's palette**: instead of Radix's scales, each semantic scale's 12
  steps set from a Tailwind family, light and dark, after the theme --
  the site's theme studio, its Tailwind tab, writes it (Copy theme). A
  theme is one or the other, never a mix. The steps' shades are chosen so
  the same contrast holds; with some neutrals, a few accents are left out
  (their fill would not show on a track). A Tailwind theme also brings
  Tailwind's own colour classes back (`bg-rose-500`), which the kit
  otherwise turns off, for one-off touches:

  ```css
  @import "tailwindcss/theme.css" layer(theme);
  ```
- **Or a shadcn theme**: in a project whose colours are shadcn's tokens
  (`--background`, `--primary`, `--ring`, the `--sidebar` set,
  `--radius`, under `:root` and `.dark`: ui.shadcn.com/docs/theming), the
  kit's parts take that theme. Import it after the kit's theme, with
  Tailwind's palette, which a shadcn project's code may use:

  ```css
  @import "tailwindcss";
  @import "thriftyui/theme.css";
  @import "thriftyui/shadcn.css";
  @import "tailwindcss/theme.css" layer(theme);
  @source "../node_modules/thriftyui/dist";
  /* then the project's :root, .dark and @theme inline, as shadcn writes them */
  ```

  A solid button takes `--primary`, a plain one `--secondary`, a field's
  edge `--input`, the focus ring `--ring`, a column `--sidebar`, what is
  chosen or highlighted `--accent`, the corners `--radius`; the steps
  between shadcn's roles are mixed from them. The contrast above is the
  kit's own themes'; with a shadcn theme it is that theme's. One of the
  three -- Radix, Tailwind or shadcn -- never a mix.
- **A part's own colour**: each part's colours have names of their own --
  `--button-solid`, `--field-border`, `--focus`, `--choice-on`,
  `--chosen`, `--badge-accent`, `--card`, `--popover` (popovers, menus,
  select lists and toasts, the card's colour unless set), `--overlay` (the
  shade behind a dialog or sheet), `--bank-card`, `--message-own` (a
  message the person sent) and the rest, listed in `theme.css` -- each
  following a semantic scale's step unless set, so a theme can colour solid buttons
  alone, say. The theme studio's Tailwind tab sets them, and warns when a
  pair falls under WCAG's contrast.
- **Corners**: `data-radius="none" | "small" | "medium" | "large"` scales
  every corner (medium is Tailwind's own sizes).
- **Shadows**: none by default; `data-shadow="small" | "medium" | "large"`
  gives popovers, menus and select lists a lighter shadow and dialogs and
  floating columns a deeper one, from Tailwind's shadow sizes.
- **Finish**: flat by default; `data-finish="metal"` gives every
  header, footer and the bottom bar a metal: a smooth shading from the
  neutral's step 1 to its step 4, light and dark. `data-finish="zebra"`,
  `"leopard"`, `"tiger"`, `"funfetti"`, `"sky"` or `"fishtank"` gives them
  a pattern under a veil of the bar's own colour, with the bars' grey
  words at the neutral's darkest step; add
  `@import "thriftyui/patterns.css";` after the theme to offer them
  (about 440 KB, the tiles inside it). The fish tank swims while the
  pointer is over a bar; `data-finish-motion="loop"` beside it keeps it
  swimming, and then the app gives its people a way to turn that off
  (WCAG 2.2, 2.2.2 Pause, Stop, Hide). Anything else can wear the finish
  too, following the same setting: the `finish` class; `--metal` is the
  metal whatever the setting.
- **Density**: `data-scaling="90%" | "95%" | "100%" | "105%" | "110%"`
  (Radix Themes' steps) scales the bars' heights, the rows and the
  columns' width, not the text; 100% by default.
- **Font**: Tailwind's `--font-sans`, the system font by default:

  ```css
  @theme inline { --font-sans: "Inter", sans-serif; }
  ```

## Right to left

Set `dir="rtl"` on the root and wrap the app in Radix's provider, which
Radix's parts and the kit's read:

```tsx
import * as Direction from 'radix-ui/direction'
<Direction.Provider dir="rtl">...</Direction.Provider>
```

Text, spacing, menus, arrows and slides mirror. A column's `side` is
where it is on the screen in either direction: give navigation
`side="right"` in a right-to-left app if that is where it belongs.
