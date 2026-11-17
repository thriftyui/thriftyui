// What the chat reads off Claude Code's screen in the terminal, and how it
// switches the permission mode, its labels checked against Claude Code's
// docs.
//
// Claude Code has no call that reports or sets the running session's mode;
// it shows the mode on the status bar under the prompt, and Shift+Tab
// moves it on: "The status bar shows the active mode as a gray `⏸ manual
// mode on` for `default`, or as `⏵⏵ accept edits on`, `⏸ plan mode on`,
// `⏵⏵ auto mode on`, `⏵⏵ don't ask on`, or `⏵⏵ bypass permissions on`";
// "From `auto`, the first press switches to `default`, and the cycle then
// runs `default` → `acceptEdits` → `plan`. Optional modes slot in after
// `plan`" (code.claude.com/docs/en/permission-modes.md, Switch permission
// modes, read 2026-10-17). So the chat reads the status bar from the
// terminal's screen and presses Shift+Tab until it shows the mode chosen.
//
// Voice: "The footer shows `keep holding…` during warmup, then
// `listening…` once recording is active" (voice-dictation.md, Hold to
// record, read 2026-10-17).

/** Shift+Tab as a terminal sends it (back-tab, CSI Z). */
export const SHIFT_TAB = '\x1b[Z'

const LABELS: [RegExp, string][] = [
  [/\bmanual mode on\b/, 'default'],
  [/\baccept edits on\b/, 'acceptEdits'],
  [/\bplan mode on\b/, 'plan'],
  [/\bauto mode on\b/, 'auto'],
  [/\bdon't ask on\b/, 'dontAsk'],
  [/\bbypass permissions on\b/, 'bypassPermissions'],
]

/** The last line with anything on it: the status bar, or a dialog's foot. */
const footOf = (lines: readonly string[]) => [...lines].reverse().find((l) => l.trim() !== '')

/** The mode the status bar shows; null when it shows none (a dialog drawn
 *  in its place, or Claude Code not drawn yet). Only that line is read, so
 *  a label quoted in the conversation above is never taken. */
export function modeFromScreen(lines: readonly string[]): string | null {
  const foot = footOf(lines)
  if (foot === undefined) return null
  for (const [re, mode] of LABELS) if (re.test(foot)) return mode
  return null
}

/** Claude Code's permission prompt waiting on screen: its foot is "Esc to
 *  cancel" (seen as "Esc to cancel · Tab to amend" under
 *  "Do you want to proceed?", Claude Code 2.1.289). */
export function promptWaiting(lines: readonly string[]): boolean {
  const foot = footOf(lines)
  return foot !== undefined && /^\s*Esc to cancel\b/.test(foot)
}

/** Voice dictation recording, or warming up to. */
export function listeningOnScreen(lines: readonly string[]): 'listening' | 'warming' | null {
  const text = lines.slice(-4).join('\n')
  if (/listening…/.test(text)) return 'listening'
  if (/keep holding…/.test(text)) return 'warming'
  return null
}

export type CycleResult = 'switched' | 'not offered' | 'no change' | 'unknown'

/** Moves the session to `target` by pressing Shift+Tab, reading the mode
 *  after each press: "switched" once the status bar shows `target`; "not
 *  offered" when the cycle came back to where it started; "no change" when
 *  it did not move within the wait, or after `max` presses; "unknown" when
 *  no mode was on screen to start from (nothing is pressed then). */
export async function cycleTo(
  target: string,
  io: { current: () => string | null; press: () => void; next: () => Promise<string | null> },
  max = 7,
): Promise<CycleResult> {
  const start = io.current()
  if (start === null) return 'unknown'
  if (start === target) return 'switched'
  for (let i = 0; i < max; i++) {
    const waiting = io.next()
    io.press()
    const now = await waiting
    if (now === null) return 'no change'
    if (now === target) return 'switched'
    if (now === start) return 'not offered'
  }
  return 'no change'
}
