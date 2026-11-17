// The prototype's pages, in the order the navigation lists them. Each has
// its address and its name, shown in the navigation and the page's header.

export const ROUTES = [
  { path: '/', title: 'Overview' },
  { path: '/columns', title: 'Columns' },
  { path: '/dialog', title: 'Dialog' },
  { path: '/drawer', title: 'Drawer' },
  { path: '/components', title: 'Components' },
] as const
