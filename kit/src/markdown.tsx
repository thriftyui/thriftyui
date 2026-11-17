'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import type { LinkAs } from './chat.tsx'
import { cn } from './cn.ts'

// Its own entry, its two packages optional peers, so an app without a chat
// installs neither. Safe for text the app did not write: HTML is escaped
// and unsafe links go nowhere (react-markdown's defaults; no rehype-raw).
// A task's checkbox is named by its task's text.

const PROSE = cn(
  'text-sm leading-relaxed text-neutral-12 break-words',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
  '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-5 [&_ol]:ps-5 [&_li]:my-0.5',
  '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold',
  '[&_a]:text-accent-12 [&_a]:underline [&_a]:underline-offset-2',
  '[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-neutral-3 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.875em]',
  '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-neutral-3 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:focus-visible:outline-2 [&_pre]:focus-visible:-outline-offset-2 [&_pre]:focus-visible:outline-focus',
  '[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-neutral-6 [&_blockquote]:ps-3 [&_blockquote]:text-neutral-11',
  '[&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse [&_th]:border-b [&_th]:border-neutral-6 [&_th]:py-1 [&_th]:pe-3 [&_th]:text-start [&_th]:font-medium [&_td]:border-b [&_td]:border-neutral-6 [&_td]:py-1 [&_td]:pe-3',
  '[&_hr]:my-3 [&_hr]:border-neutral-6',
)

/** Enough of a syntax-tree node (hast) to read its text. */
type TreeNode = { type: string; tagName?: string; value?: string; children?: TreeNode[] }

/** A node's words, nested lists left out. */
const textOf = (n: TreeNode): string =>
  n.type === 'text' ? (n.value ?? '') : n.tagName === 'ul' || n.tagName === 'ol' ? '' : (n.children ?? []).map(textOf).join('')

/** The text of the task item a checkbox is in. */
const TaskText = createContext<string | undefined>(undefined)

function TaskCheckbox(props: ComponentProps<'input'>) {
  const name = useContext(TaskText)
  return <input {...props} aria-label={props.type === 'checkbox' && name ? name : props['aria-label']} />
}

/** `linkAs`: what draws the links in the text (chat.tsx, LinkAs), given
 *  the address react-markdown has already made safe. */
export function Markdown({ children, linkAs: A, className }: { children: string; linkAs?: LinkAs; className?: string }) {
  return (
    <div className={cn(PROSE, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // A code block scrolls sideways when its lines are long, so it is
          // a tab stop: the keyboard can then scroll it (axe-core,
          // scrollable-region-focusable).
          pre: ({ node: _node, ...props }) => <pre tabIndex={0} {...props} />,
          li: ({ node, children, ...props }) =>
            (props.className ?? '').split(' ').includes('task-list-item') ? (
              <li {...props}>
                <TaskText.Provider value={textOf(node as TreeNode).trim()}>{children}</TaskText.Provider>
              </li>
            ) : (
              <li {...props}>{children}</li>
            ),
          input: ({ node: _node, ...props }) => <TaskCheckbox {...props} />,
          ...(A ? { a: ({ href, children }: { href?: string; children?: ReactNode }) => (href ? <A href={href}>{children}</A> : <>{children}</>) } : {}),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
