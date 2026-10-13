import { optionalAffordance } from '@/components/studies/audience/styles'
import { sectionEyebrow, sectionHelp, sectionTitle } from '../conceptStyles'

export default function ConceptAudienceHead() {
  return (
    <>
      <div style={sectionEyebrow}>Section 4 · Audience</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Who qualifies
      </h2>
      <p style={{ ...sectionHelp, marginBottom: 12 }}>
        Optional filters on who can take this study. Concept studies have no
        “tried this product” gate — nobody has tried a concept that doesn’t
        exist yet.
      </p>
      <p style={optionalAffordance}>
        All filters are optional. Leave them blank to let anyone take the study.
      </p>
    </>
  )
}
