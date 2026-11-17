'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn.ts'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'

// After the W3C's Sortable Table example: aria-sort on the sorted column,
// the sort icons hidden from the button's name, and an unsorted column's
// icon a different shape, not only a different colour.

/** A column of a DataTable: its id, its header, how to draw its cell from a
 *  row, what it sorts by (none, it does not sort), its alignment, and
 *  whether its cell names the row. */
export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  /** What the column sorts by; without it, the column does not sort. */
  sortValue?: (row: T) => string | number
  /** Numbers read best lined up at the end. */
  align?: 'start' | 'end'
  /** The cell that names its row: a row header (<th scope="row">). */
  rowHeader?: boolean
}

type Sort = { column: string; direction: 'ascending' | 'descending' }

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** A table of rows sorted by a column: the kit's Table, each sortable
 *  column's header a button, aria-sort on the sorted one. A press on the
 *  sorted column turns the order over; on another, sorts by it, ascending.
 *  Filtering, pages and choosing rows are the app's. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  defaultSort,
  className,
}: {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  /** The table's name, shown under it. */
  caption: string
  defaultSort?: Sort
  className?: string
}) {
  const [sort, setSort] = useState<Sort | undefined>(defaultSort)
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.id === sort?.column)
    if (!sort || !col?.sortValue) return rows
    const by = col.sortValue
    const out = [...rows].sort((a, b) => {
      const x = by(a)
      const y = by(b)
      return typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))
    })
    return sort.direction === 'descending' ? out.reverse() : out
  }, [rows, columns, sort])

  const sortable = columns.some((c) => c.sortValue)
  const press = (id: string) =>
    setSort((s) => (s?.column === id ? { column: id, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { column: id, direction: 'ascending' }))

  return (
    <Table className={className}>
      <TableCaption>
        {caption}
        {sortable && <span className="sr-only"> (column headers with buttons are sortable)</span>}
      </TableCaption>
      <TableHeader>
        <TableRow>
          {columns.map((c) => {
            const on = sort?.column === c.id ? sort.direction : undefined
            const Icon = on === 'ascending' ? ArrowUp : on === 'descending' ? ArrowDown : ChevronsUpDown
            return (
              <TableHead key={c.id} aria-sort={on} className={cn(c.align === 'end' && 'text-end', c.sortValue && 'px-1')}>
                {c.sortValue ? (
                  <button
                    type="button"
                    onClick={() => press(c.id)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1 rounded-md px-2 font-medium text-neutral-11 transition-colors hover:text-neutral-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                      on && 'text-neutral-12',
                      c.align === 'end' && 'flex-row-reverse',
                    )}
                  >
                    {c.header}
                    <Icon aria-hidden className={cn('size-3.5 shrink-0', !on && 'text-neutral-11')} strokeWidth={2} />
                  </button>
                ) : (
                  c.header
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((c) =>
              c.rowHeader ? (
                <TableHead key={c.id} scope="row" className={cn('font-normal text-neutral-12', c.align === 'end' && 'text-end')}>
                  {c.cell(row)}
                </TableHead>
              ) : (
                <TableCell key={c.id} className={cn(c.align === 'end' && 'text-end tabular-nums')}>
                  {c.cell(row)}
                </TableCell>
              ),
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
