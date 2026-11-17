import { NavLink } from 'react-router'
import { Menu } from 'lucide-react'
import { CELL, CELL_ICON } from 'thriftyui/cell'
import { Arranged } from './examples/arrangements'
import { Column, ColumnClose, ColumnContent, ColumnFooter, ColumnHeader } from 'thriftyui/column'
import { ColumnDrawer, ColumnDrawerClose, ColumnDrawerContent, ColumnDrawerTrigger } from 'thriftyui/column-drawer'
import { ROUTES } from './routes'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'thriftyui/dropdown-menu'
import { useSettings } from './settings'
import { NavItem, NavList } from 'thriftyui/nav-list'

// The prototype's two columns and its menu of pages.
//
//   left    the navigation (NavList, kit/src/nav-list.tsx): the pages, the
//           one showing marked by React Router's NavLink ("Automatically applies aria-current="page" to
//           the link when the link is active", reactrouter.com, NavLink),
//           and a drawer rising from its footer
//   right   the details: three bodies arranged the way the Columns page
//           says, as the dialog's are, less the rail; on a phone it rises
//           from the bottom
//   menu    the pages again, in the page's header, for when there is no
//           left column (the kit's DropdownMenu, an item as a link)


/** A drawer body: rows, at the kit's row height (--row-height), so a
 *  drawer `rows` tall shows exactly that many (the Drawer page's Height). */
function DrawerRows(label: string) {
  return (
    <ul>
      {[1, 2, 3].map((n) => (
        <li key={n} className="flex h-(--row-height) items-center px-3 text-sm text-neutral-11">
          {label}, row {n}
        </li>
      ))}
    </ul>
  )
}

export function LeftColumn() {
  // The drawer arranged from the Drawer page (src/pages/DrawerPage.tsx).
  const { drawer, drawerSlide, drawerSize } = useSettings()
  return (
    <Column side="left" aria-label="Pages">
      <ColumnDrawer>
        <ColumnHeader>
          <span className="flex-1 self-center truncate px-3 text-sm font-semibold">ThriftyUI</span>
          <ColumnClose />
        </ColumnHeader>
        <ColumnContent>
          <NavList aria-label="Pages">
            {ROUTES.map((r) => (
              <NavItem key={r.path} asChild>
                <NavLink to={r.path} end>
                  {r.title}
                </NavLink>
              </NavItem>
            ))}
          </NavList>
        </ColumnContent>
        <ColumnDrawerContent
          aria-label="Drawer"
          // Its own header (the arrangement's) counts above the rows.
          header
          rows={drawerSize === '1' ? 1 : drawerSize === '3' ? 3 : undefined}
          size={drawerSize === 'full' ? 'full' : 'half'}
        >
          <Arranged
            key={drawer}
            way={drawer}
            slide={drawerSlide}
            title={(hidden) => (hidden ? null : <span className="self-center truncate px-3 text-sm font-semibold">Drawer</span>)}
            end={<ColumnDrawerClose />}
            body={DrawerRows}
          />
        </ColumnDrawerContent>
        <ColumnFooter>
          <ColumnDrawerTrigger>Drawer</ColumnDrawerTrigger>
        </ColumnFooter>
      </ColumnDrawer>
    </Column>
  )
}

export function RightColumn() {
  // Arranged from the Columns page (src/pages/Columns.tsx).
  const { details, detailsSlide } = useSettings()
  return (
    <Column side="right" sheet="bottom" aria-label="Details">
      <Arranged
        key={details}
        way={details}
        slide={detailsSlide}
        title={(hidden) => (hidden ? null : <span className="self-center truncate px-3 text-sm font-semibold">Details</span>)}
        end={<ColumnClose />}
      />
    </Column>
  )
}

/** The pages as a menu in the page's header, when there is no left column
 *  to hold them. */
export function PagesMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Pages" className={CELL}>
        <Menu aria-hidden className={CELL_ICON} strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {ROUTES.map((r) => (
          <DropdownMenuItem key={r.path} asChild className="aria-[current=page]:font-semibold">
            <NavLink to={r.path} end>
              {r.title}
            </NavLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
