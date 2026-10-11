import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import { AttributeJarBook, groupAttributes } from './AttributeJarBook'
import { pct, unit } from './format'

export function AttributeEvidenceChapter({
  report,
  productName,
  productRef,
  number = '04',
}: {
  report: IhutCoreReport
  productName: string
  productRef: number
  number?: string
}) {
  const rows = report.attribute_penalties ?? []
  const groups = groupAttributes(rows)
  const heroRows = rows.filter((r) => r.ref === productRef)
  const worst = [...heroRows].sort(
    (a, b) => unit(a.just_right_share) - unit(b.just_right_share),
  )[0]
  const title = worst
    ? `${worst.attribute_label}: ${pct(worst.just_right_share)} just right for ${productName}.`
    : 'Just-right diagnostics across attributes.'

  return (
    <StoryChapter
      id="attributes"
      number={number}
      kicker="Evidence · Attributes"
      title={title}
      lead="Every attribute in the freeze, for every product with ratings. Directional — not proof that changing one attribute will move the verdict."
      context={`${groups.length} attribute${groups.length === 1 ? '' : 's'}`}
    >
      <AttributeJarBook rows={rows} heroRef={productRef} />
    </StoryChapter>
  )
}
