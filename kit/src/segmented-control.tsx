'use client'

import * as ToggleGroup from 'radix-ui/toggle-group'
import { GROUP, GROUP_CELL } from './cell.ts'

/** A row of choices, one always chosen (Radix's Toggle Group, single):
 *  named by `label`, `value` held by the app, `onChange` called with the
 *  one pressed. Looks as a ButtonGroup does. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T)
      }}
      className={GROUP}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className={GROUP_CELL}
        >
          <span className="truncate">{o.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
