import axe from 'axe-core'
import { expect } from 'vitest'

// Runs axe-core over a rendered part and fails on any violation. Two rules
// are off: colour contrast, which jsdom cannot measure (it has no layout or computed
// styles; check it in a browser), and "region", a page-level rule that
// everything sit in a landmark, which is the app's job, not a part's.

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  })
  if (results.violations.length > 0) {
    const summary = results.violations.map((v) => `  - ${v.id}: ${v.help} [${v.nodes.length} node(s)]`).join('\n')
    expect.fail(`axe found ${results.violations.length} accessibility violation(s):\n${summary}`)
  }
}
