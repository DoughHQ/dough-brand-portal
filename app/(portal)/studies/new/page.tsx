'use client'

import '../studiesPage.css'
import NewStudyChooserIntro from './chooser/NewStudyChooserIntro'
import StudyChoiceCard from './chooser/StudyChoiceCard'

export default function NewStudyChooserPage() {
  return (
    <div
      className="studies-shell"
      style={{
        padding: 'var(--space-4, 32px) var(--space-3, 24px)',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <NewStudyChooserIntro />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <StudyChoiceCard
            href="/studies/concept/new"
            icon="◇"
            title="Concept test"
            description="Validate names, packaging, and claims before you ship a physical product."
          />
          <StudyChoiceCard
            href="/studies/box/new"
            icon="▣"
            title="iHUT study"
            description="Ship real products to qualified people and measure what they actually reach for."
          />
        </div>
      </div>
    </div>
  )
}
