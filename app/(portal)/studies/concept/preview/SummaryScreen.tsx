import type { ReactNode } from 'react'
import Link from 'next/link'
import type { RecapAnswer, RecapModel, RecapSubject } from '@/lib/concept/preview/recap'
import StimulusImage from './StimulusImage'

type Props = {
  recap: RecapModel
  editHref: string
  onSeeSample: () => void
}

function KindMark({ kind }: { kind?: string }) {
  if (kind === 'concept') return <div className="cpw-subject-kind">Your concept</div>
  if (kind === 'product') {
    return (
      <div className="cpw-subject-kind" data-kind="product">
        In the field
      </div>
    )
  }
  return null
}

function SubjectRow({ subject }: { subject: RecapSubject }) {
  return (
    <div className="cpw-recap-subject">
      <StimulusImage
        src={subject.image_url}
        alt=""
        unavailable={subject.image_unavailable}
        placeholderClassName="cpw-subject-ph"
      />
      <div>
        <KindMark kind={subject.kind} />
        <div className="cpw-tile-name">{subject.name}</div>
      </div>
    </div>
  )
}

function AnswerCard({ answer }: { answer: RecapAnswer }) {
  return (
    <div className="cpw-recap-card">
      <div className="cpw-recap-q">{answer.title}</div>
      <div className="cpw-recap-a">{answer.values.join(', ') || '—'}</div>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="cpw-recap-section">
      <p className="cpw-recap-eyebrow">{eyebrow}</p>
      <h3 className="cpw-recap-h">{title}</h3>
      {children}
    </section>
  )
}

export default function SummaryScreen({ recap, editHref, onSeeSample }: Props) {
  return (
    <div className="cpw-recap">
      <h2 className="cpw-prompt">Your walkthrough</h2>
      <p className="cpw-help">
        A recap of what you clicked — not a score, not a prediction.
      </p>

      {recap.isEmpty ? (
        <p className="cpw-recap-empty">
          You moved through the walkthrough without leaving answers.
        </p>
      ) : null}

      {recap.battles ? (
        <Section eyebrow="Battles" title="Your battles">
          {recap.battles.subject ? (
            <SubjectRow subject={recap.battles.subject} />
          ) : null}
          <p className="cpw-recap-lead">{recap.battles.headline}</p>
        </Section>
      ) : null}

      {recap.aboutYou.length > 0 ? (
        <Section eyebrow="Screeners" title="About you">
          {recap.aboutYou.map((a, i) => (
            <AnswerCard key={`you-${i}`} answer={a} />
          ))}
        </Section>
      ) : null}

      {recap.alongTheWay.length > 0 ? (
        <Section eyebrow="Follow-ups" title="Along the way">
          {recap.alongTheWay.map((a, i) => (
            <div key={`why-${i}`} className="cpw-recap-cluster">
              {a.subject ? <SubjectRow subject={a.subject} /> : null}
              <AnswerCard answer={a} />
            </div>
          ))}
        </Section>
      ) : null}

      {recap.reactions.length > 0 ? (
        <Section eyebrow="Diagnostics" title="Your reactions">
          {recap.reactions.map((group) => (
            <div key={group.key} className="cpw-recap-cluster">
              {group.subject ? <SubjectRow subject={group.subject} /> : null}
              {group.answers.map((a, i) => (
                <AnswerCard key={`${group.key}-${i}`} answer={a} />
              ))}
            </div>
          ))}
        </Section>
      ) : null}

      <div className="cpw-recap-nav">
        <button
          type="button"
          className="cpw-next cpw-recap-cta"
          onClick={onSeeSample}
        >
          See what you&apos;ll receive
        </button>
        <Link className="cpw-back" href={editHref}>
          Back to your study
        </Link>
      </div>
    </div>
  )
}
