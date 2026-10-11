import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import {
  REPORT_SECTIONS,
  pushNote,
  type SectionMethodNotes,
} from './reportSections'

const PREFERENCE_METHOD_NOTE =
  'What was measured — not a launch recommendation. Experience splits are never pooled.'

export function notesFor(
  bucket: SectionMethodNotes[],
  section: number,
): string[] {
  return bucket.find((b) => b.section === section)?.texts ?? []
}

export function collectMethodNotes(
  envelope: ExperiencedReportEnvelope,
): SectionMethodNotes[] {
  const { report } = envelope
  const bucket: SectionMethodNotes[] = []
  const s = REPORT_SECTIONS

  pushNote(bucket, 1, s[0].title, PREFERENCE_METHOD_NOTE)

  pushNote(bucket, 2, s[1].title, report.choice_drivers?.timing_note)
  pushNote(bucket, 2, s[1].title, report.choice_drivers?.presentation_control)

  const multi =
    typeof report.methodology?.multiple_comparison_note === 'string'
      ? report.methodology.multiple_comparison_note
      : null
  pushNote(bucket, 3, s[2].title, multi)

  pushNote(bucket, 4, s[3].title, report.attribute_importance?.estimator_note)
  pushNote(bucket, 4, s[3].title, report.attribute_importance?.variance_note)
  pushNote(
    bucket,
    4,
    s[3].title,
    report.attribute_importance?.presentation_control,
  )

  pushNote(bucket, 5, s[4].title, report.repurchase_intent?.timing_note)
  pushNote(
    bucket,
    5,
    s[4].title,
    report.repurchase_intent?.presentation_control,
  )

  pushNote(bucket, 6, s[5].title, report.rank_validation?.undetermined_note)

  const drift =
    typeof report.methodology?.drift_causality_note === 'string'
      ? report.methodology.drift_causality_note
      : null
  pushNote(bucket, 7, s[6].title, drift)

  return bucket
}
