import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveConceptNarratives } from '../conceptTestNarrative'
import {
  parseConceptTestEnvelope,
  parseConceptTestReport,
} from '../conceptTestTypes'

function fixtureReport() {
  const raw = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'concept-core-fixtures/report_concept_test.json'),
      'utf8',
    ),
  )
  const report = parseConceptTestReport(raw)
  if (!report) throw new Error('Concept fixture did not parse')
  return report
}

describe('deriveConceptNarratives', () => {
  it('honors the server verdict when a point estimate looks favorable', () => {
    const [narrative] = deriveConceptNarratives(fixtureReport())
    expect(narrative.headline).toBe(
      'The decision on New design is still too close to call.',
    )
    expect(narrative.metrics[0]).toMatchObject({
      value: '66.7%',
      interval: '39.1%–86.2%',
      result: 'too_close_to_call',
    })
    expect(narrative.implication).toContain('point estimate')
  })

  it('labels price as stated willingness to pay, not forecast demand', () => {
    const [narrative] = deriveConceptNarratives(fixtureReport())
    const price = narrative.metrics.find((metric) => metric.key === 'price')
    expect(price?.label).toBe('Would pay $7.99')
    expect(
      `${narrative.headline} ${narrative.implication}`.toLowerCase(),
    ).not.toContain('will sell')
  })

  it('never recomputes the overall server verdict from attractive metrics', () => {
    const report = fixtureReport()
    report.verdict[0].overall = 'not_cleared'
    report.verdict[0].head_to_head.result = 'cleared'
    report.verdict[0].price.result = 'cleared'
    const [narrative] = deriveConceptNarratives(report)
    expect(narrative.headline).toBe(
      'New design did not clear the success test.',
    )
  })

  it('does not infer drivers when what-matters evidence is absent', () => {
    const report = fixtureReport()
    expect(report.what_matters?.items).toHaveLength(0)
    const serialized = JSON.stringify(deriveConceptNarratives(report))
    expect(serialized.toLowerCase()).not.toContain('driver')
  })
})

describe('parseConceptTestEnvelope', () => {
  it('unwraps the production concept_test RPC envelope', () => {
    const fixture = fixtureReport()
    const parsed = parseConceptTestEnvelope({ concept_test: fixture })
    expect(parsed?.verdict[0]?.name).toBe('New design')
  })
})
