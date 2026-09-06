export const REPORT_SECTIONS = [
  {
    id: 'report-s1',
    n: 1,
    label: 'Preference',
    title: 'Preference among people who’ve consumed it',
  },
  {
    id: 'report-s2',
    n: 2,
    label: 'Why they chose',
    title: 'Why they chose — or didn’t',
  },
  {
    id: 'report-s3',
    n: 3,
    label: 'Against the shelf',
    title: 'Against the shelf',
  },
  {
    id: 'report-s4',
    n: 4,
    label: 'What matters',
    title: 'What matters in the category',
  },
  {
    id: 'report-s5',
    n: 5,
    label: 'Would they buy again',
    title: 'Would they buy again',
  },
  {
    id: 'report-s6',
    n: 6,
    label: 'Does the ranking hold up',
    title: 'Does the ranking hold up',
  },
  {
    id: 'report-s7',
    n: 7,
    label: 'Did preference move',
    title: 'Did preference move',
  },
] as const

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]['id']

export type SectionMethodNotes = {
  section: number
  heading: string
  texts: string[]
}

export function pushNote(
  bucket: SectionMethodNotes[],
  section: number,
  heading: string,
  text: string | null | undefined
) {
  const t = typeof text === 'string' ? text.trim() : ''
  if (!t) return
  const existing = bucket.find((b) => b.section === section)
  if (existing) {
    if (!existing.texts.includes(t)) existing.texts.push(t)
    return
  }
  bucket.push({ section, heading, texts: [t] })
}
