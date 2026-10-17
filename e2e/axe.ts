import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Fails on critical and serious violations only; moderate and minor findings
// are left to review so a smoke run stays a release gate, not an audit.
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  // Entrance fades blend text into the canvas; axe would score the mid-fade colors.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== 'running' ||
          a.effect?.getComputedTiming().iterations === Infinity,
      ),
  )
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
  const blocking = results.violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }))
  expect(blocking, `axe violations on ${page.url()}`).toEqual([])
}
