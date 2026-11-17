// The rule a coding assistant's "/" menu follows: filtered as you type;
// the top match highlighted only when the letters start the name, an
// alias or a word in it (separators ignored); after a typo, close matches
// listed and none highlighted. A name starting with the letters comes
// before one with a word inside that does.

/** A command in a message box's "/" menu (chat.tsx, Composer). */
export interface ComposerCommand {
  name: string
  /** Its arguments, as written after the name: <required>, [optional]. */
  hint?: string
  description: string
  /** Other names it is found by. */
  aliases?: string[]
}

const squash = (s: string) => s.toLowerCase().replace(/[:_-]/g, '')
const names = (c: ComposerCommand) => [c.name, ...(c.aliases ?? [])]

/** A word of the name, or the name itself, starts with the letters. */
const fromWord = (name: string, q: string) => {
  const words = name.toLowerCase().split(/[:_-]/)
  return words.some((_, i) => squash(words.slice(i).join('')).startsWith(q))
}

/** The letters are in the name in order, with others between. */
const inOrder = (name: string, q: string) => {
  let at = 0
  for (const ch of squash(name)) if (ch === q[at]) at++
  return at === q.length
}

/** The commands to list for what is typed after the "/", and the index of
 *  the one highlighted: -1 when none is, after a typo. */
export function matchCommands<C extends ComposerCommand>(commands: C[], typed: string): { shown: C[]; highlight: number } {
  const q = squash(typed)
  if (!q) return { shown: commands, highlight: 0 }
  const starts = commands.filter((c) => names(c).some((n) => squash(n).startsWith(q)))
  const words = commands.filter((c) => !starts.includes(c) && names(c).some((n) => fromWord(n, q)))
  const close = commands.filter((c) => !starts.includes(c) && !words.includes(c) && names(c).some((n) => inOrder(n, q)))
  const matched = [...starts, ...words]
  return { shown: [...matched, ...close], highlight: matched.length > 0 ? 0 : -1 }
}
