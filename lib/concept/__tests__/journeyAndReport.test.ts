import { describe, expect, it } from 'vitest'
import {
  mapJourneyForPhonePreview,
  parseConceptJourney,
  phonePreviewLeaksBrandLabels,
} from '../journey'
import journeyFixture from '../../../concept-core-fixtures/journey.json'
import {
  isConceptTestReportPayload,
  parseConceptTestReport,
} from '@/lib/conceptReport/conceptTestTypes'
import reportFixture from '../../../concept-core-fixtures/report_concept_test.json'

describe('mapJourneyForPhonePreview', () => {
  it('remaps brand arm names to Design letters', () => {
    const parsed = parseConceptJourney(journeyFixture)
    expect(parsed).not.toBeNull()
    const arms = [
      { display_name: 'New design', arm_label: 'New design' },
      { display_name: 'Current pack', arm_label: 'Current pack' },
    ]
    const preview = mapJourneyForPhonePreview(parsed!, arms)
    const labels = preview.screens
      .map((s) => s.subject?.respondent_label)
      .filter((x): x is string => !!x)
    expect(labels.length).toBeGreaterThan(0)
    for (const name of labels) {
      expect(name).toMatch(/^Design [A-Z0-9]+$/)
    }
    expect(phonePreviewLeaksBrandLabels(preview)).toEqual([])
  })
})

describe('parseConceptTestReport', () => {
  it('detects and parses the fixture', () => {
    expect(isConceptTestReportPayload(reportFixture)).toBe(true)
    const report = parseConceptTestReport(reportFixture)
    expect(report).not.toBeNull()
    expect(report!.verdict).toHaveLength(1)
    expect(report!.verdict[0]!.overall).toBe('too_close_to_call')
    expect(report!.method?.head_to_head).toBeTruthy()
    expect(report!.sample.n_completed).toBe(0)
  })
})
