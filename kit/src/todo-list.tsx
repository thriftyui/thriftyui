'use client'

import { useId, type ComponentProps } from 'react'
import { Circle, CircleCheck, CircleDot } from 'lucide-react'
import { cn } from './cn.ts'

// The item being done is aria-current="step" and shows its activeForm.

/** Where an item is: to do (`pending`), being done (`in_progress`) or done
 *  (`completed`). */
export type TodoStatus = 'pending' | 'in_progress' | 'completed'

/** An item of the list: what is to be done, where it is, and its wording
 *  while it is being done ("Running the tests" for "Run the tests"). */
export interface TodoItem {
  content: string
  status: TodoStatus
  /** Its wording while it is being done. */
  activeForm?: string
}

const STATES = {
  pending: { Icon: Circle, word: 'To do' },
  in_progress: { Icon: CircleDot, word: 'Doing' },
  completed: { Icon: CircleCheck, word: 'Done' },
} as const

/** An assistant's to-do list as it works through a task: a list named by
 *  its `title`, each item's state a shape and a word, not a colour alone;
 *  the item being done marked as the current step, done ones struck
 *  through. */
export function TodoList({
  items,
  title = 'To-do',
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'title' | 'children'> & {
  items: TodoItem[]
  /** Its heading, which names the list.
   *  @defaultValue `'To-do'` */
  title?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1 rounded-lg border border-neutral-6 p-3 text-sm', className)} {...props}>
      <p id={id} className="text-xs font-medium text-neutral-11">
        {title}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-1">
        {items.map((t, i) => {
          const state = STATES[t.status] ?? STATES.pending
          const doing = t.status === 'in_progress'
          return (
            <li
              key={i}
              aria-current={doing ? 'step' : undefined}
              className={cn('flex items-start gap-2', t.status === 'completed' ? 'text-neutral-11 line-through' : 'text-neutral-12', doing && 'font-medium')}
            >
              <state.Icon aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              <span className="sr-only">{state.word}: </span>
              <span>{doing && t.activeForm ? t.activeForm : t.content}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
