'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import * as Popover from 'radix-ui/popover'
import { Check, ChevronDown } from 'lucide-react'
import { CELL_ICON } from './cell.ts'
import { cn } from './cn.ts'
import { FIELD } from './input.tsx'
import { MENU_CONTENT, MENU_INDICATOR, MENU_INSET, MENU_ITEM } from './menu-class.ts'

// The W3C's Editable Combobox With List Autocomplete (Radix has none):
// focus stays in the field, aria-activedescendant naming the option the
// keyboard is on. Keys: Down and Up open and move (wrapping); Alt+Down
// opens, Alt+Up closes; Enter chooses; Escape closes, then clears; Home,
// End, Left and Right edit the field. The button beside it is out of the
// tab order. Typing over a choice unsets it (null).
//
// The list is on Radix's Popover, anchored to the field; Radix sets the
// content's role to dialog first, so role="listbox" here replaces it.

/** An option of a Combobox: its value, the label shown and typed, and
 *  whether it is disabled. */
export type ComboboxOption = { value: string; label: string; disabled?: boolean }

const startsWith = (o: ComboboxOption, query: string) => o.label.toLowerCase().startsWith(query.toLowerCase())

/** A field that suggests from a list as it is typed in, one to choose: the
 *  W3C's Combobox with list autocomplete, named by `label`. Shows the
 *  options whose labels begin with what is typed (`filter` changes that);
 *  its value is the chosen option's, or null. */
export function Combobox({
  label,
  options,
  value: given,
  defaultValue = null,
  onValueChange,
  filter = startsWith,
  id,
  className,
  disabled,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange'> & {
  /** Its name, and its list's. */
  label: string
  options: ComboboxOption[]
  value?: string | null
  /** @defaultValue `null` */
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** @defaultValue `startsWith` */
  filter?: (option: ComboboxOption, query: string) => boolean
}) {
  const [own, setOwn] = useState(defaultValue)
  const value = given !== undefined ? given : own
  const labelOf = (v: string | null) => options.find((o) => o.value === v)?.label ?? ''
  const [text, setText] = useState(() => labelOf(value))
  // What was typed since the last choice: the list is narrowed by it, so
  // reopening after a choice shows every option.
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const optionId = (v: string) => `${listId}-${options.findIndex((o) => o.value === v)}`

  const shown = query ? options.filter((o) => filter(o, query)) : options
  const enabled = shown.filter((o) => !o.disabled)
  const expanded = open && shown.length > 0

  // A value set from outside shows in the field: adjusted while rendering.
  const [prevGiven, setPrevGiven] = useState(given)
  if (given !== prevGiven) {
    setPrevGiven(given)
    // Unset, it clears the field only if the field still shows the old
    // choice: typing over a choice unsets it, and the text typed stays.
    if (given != null) setText(labelOf(given))
    else if (given === null && text === labelOf(prevGiven ?? null)) setText('')
  }

  // The option the keyboard is on stays in view in a list that scrolls.
  useEffect(() => {
    if (!active) return
    const at = options.findIndex((o) => o.value === active)
    document.getElementById(`${listId}-${at}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [active, options, listId])

  const setValue = (v: string | null) => {
    if (given === undefined) setOwn(v)
    if (v !== value) onValueChange?.(v)
  }
  const close = () => {
    setOpen(false)
    setActive(null)
  }
  const choose = (o: ComboboxOption) => {
    if (o.disabled) return
    setValue(o.value)
    setText(o.label)
    setQuery('')
    close()
  }
  const step = (by: 1 | -1) => {
    if (enabled.length === 0) return
    const at = enabled.findIndex((o) => o.value === active)
    const next = at === -1 ? (by === 1 ? 0 : enabled.length - 1) : (at + by + enabled.length) % enabled.length
    setActive(enabled[next].value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (e.altKey) setOpen(true)
        else if (!expanded) {
          setOpen(true)
          setActive(enabled[0]?.value ?? null)
        } else step(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (e.altKey) close()
        else if (!expanded) {
          setOpen(true)
          setActive(enabled[enabled.length - 1]?.value ?? null)
        } else step(-1)
        break
      case 'Enter': {
        const o = expanded && active ? shown.find((x) => x.value === active) : undefined
        if (o) {
          e.preventDefault()
          choose(o)
        } else if (expanded) {
          e.preventDefault()
          close()
        }
        break
      }
      case 'Escape':
        if (expanded) {
          e.preventDefault()
          close()
        } else if (text) {
          e.preventDefault()
          setText('')
          setQuery('')
          setValue(null)
          close()
        }
        break
      case 'Home':
      case 'End':
      case 'ArrowLeft':
      case 'ArrowRight':
        setActive(null)
        break
    }
  }

  return (
    <Popover.Root open={expanded} onOpenChange={(o) => !o && close()}>
      <Popover.Anchor asChild>
        <div ref={fieldRef} className={cn('relative w-full', className)}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-label={props['aria-labelledby'] ? undefined : label}
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-activedescendant={expanded && active ? optionId(active) : undefined}
            autoComplete="off"
            disabled={disabled}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setQuery(e.target.value)
              setActive(null)
              setOpen(true)
              if (value !== null && e.target.value !== labelOf(value)) setValue(null)
            }}
            onKeyDown={onKeyDown}
            className={cn(FIELD, 'min-h-(--row-height) pe-(--row-height)')}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={label}
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (expanded) close()
              else {
                setQuery('')
                setOpen(true)
              }
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 inset-e-0 flex w-(--row-height) items-center justify-center text-neutral-11 hover:text-neutral-12 disabled:text-neutral-8"
          >
            <ChevronDown aria-hidden className={CELL_ICON} strokeWidth={1.75} />
          </button>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          role="listbox"
          id={listId}
          aria-label={label}
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // A press in the list -- a disabled option, which lets presses
          // through, or its padding -- leaves focus in the field.
          onMouseDown={(e) => e.preventDefault()}
          // A press on the field is not outside it.
          onInteractOutside={(e) => {
            if (fieldRef.current?.contains(e.target as Node)) e.preventDefault()
          }}
          className={cn(MENU_CONTENT, 'max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-0')}
        >
          {shown.map((o) => (
            <div
              key={o.value}
              id={optionId(o.value)}
              role="option"
              aria-selected={active === o.value}
              aria-disabled={o.disabled || undefined}
              data-highlighted={active === o.value ? '' : undefined}
              data-disabled={o.disabled ? '' : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onPointerMove={() => !o.disabled && setActive(o.value)}
              onClick={() => choose(o)}
              className={cn(MENU_ITEM, MENU_INSET)}
            >
              {o.value === value && (
                <span className={MENU_INDICATOR}>
                  <Check aria-hidden strokeWidth={2} />
                </span>
              )}
              <span className="truncate">{o.label}</span>
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
