// The app's pages, in the navigation's order. Add a page here and a
// file in src/pages.
export const PAGES = [
  { path: '/', title: 'Home' },
  { path: '/about', title: 'About' },
] as const

export const titleOf = (path: string) => PAGES.find((p) => p.path === path)?.title ?? 'Not found'
