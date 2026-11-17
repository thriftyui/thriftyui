# Sources

What the kit stands on is checked against its maker, not memory: a
component's behaviour, its API, its accessibility pattern, a value it
uses. Before writing or changing it, and again when auditing it.

## Where to check

The maker's own repository or site, read this session -- from a local
clone where the project keeps one, cloned when work first needs it.

| The kit uses | Its source |
|---|---|
| Radix Primitives (`radix-ui`) | github.com/radix-ui/primitives (code), github.com/radix-ui/website, `data/primitives/` (docs) |
| Radix Colors (`@radix-ui/colors`) | github.com/radix-ui/website, `data/colors/`; the values in `node_modules/@radix-ui/colors` |
| Tailwind CSS 4 | github.com/tailwindlabs/tailwindcss (code), tailwindcss.com (docs) |
| React 19 | react.dev |
| ARIA patterns | github.com/w3c/aria-practices (the W3C's Authoring Practices) |
| WCAG 2.2 | w3.org/WAI/WCAG22 (github.com/w3c/wcag) |
| lucide-react | lucide.dev (github.com/lucide-icons/lucide) |
| tailwind-merge | github.com/dcastil/tailwind-merge |
| react-markdown, remark-gfm | github.com/remarkjs |
| Vitest, Testing Library, axe-core | vitest.dev, testing-library.com, github.com/dequelabs/axe-core |

How a peer kit does something -- shadcn/ui (github.com/shadcn-ui/ui) -- is
a comparison, never the authority for the kit's own behaviour.

## Citing

In the project's `research/`, not in the part's comment: the maker, the
page or file, and the passage, read before it is used, under the kit file
built from it. The comment keeps only the why, naming a standard in a few
words. Where Radix's page and its code disagree, the code is what runs,
and the comment says what the kit does about it.
