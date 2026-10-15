import { PROOF_CHAPTERS } from '@/lib/transparency/proofChapters'
import type { BrandProofAskCount } from '@/lib/transparency/proofAskCounts'
import { proofTabAskBadge } from '@/lib/transparency/proofAskCounts'
import { depthSummary } from './progress'
import type { RowsByMetric } from './types'
import type { StudioChaptersState } from './useStudioChapters'

type Props = Pick<
  StudioChaptersState,
  'progressByChapter' | 'activeChapter' | 'setChapterId' | 'setOpenKey'
> & {
  rowsByMetric: RowsByMetric
  pcfAsk: BrandProofAskCount | null
}

export default function ChapterRail({
  progressByChapter,
  activeChapter,
  setChapterId,
  setOpenKey,
  rowsByMetric,
  pcfAsk,
}: Props) {
  return (
    <nav className="tx-rail" aria-label="P.R.O.O.F. chapters">
      {PROOF_CHAPTERS.map((chapter) => {
        const progress = progressByChapter[chapter.id]
        const pct =
          progress.total === 0
            ? 0
            : Math.round((progress.published / progress.total) * 100)
        const active = chapter.id === activeChapter.id
        return (
          <button
            key={chapter.id}
            type="button"
            className={`tx-rail__btn${active ? ' tx-rail__btn--active' : ''}`}
            onClick={() => {
              setChapterId(chapter.id)
              setOpenKey(null)
            }}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tx-rail__letter" aria-hidden>
              {chapter.letter}
            </span>
            <span className="tx-rail__meta">
              <span className="tx-rail__name">
                {chapter.name}
                {chapter.id === 'planet' && proofTabAskBadge(pcfAsk) > 0 ? (
                  <span className="tx-rail__ask">{proofTabAskBadge(pcfAsk)}</span>
                ) : null}
              </span>
              <span className="tx-rail__progress">
                {depthSummary(
                  chapter.id,
                  progressByChapter,
                  rowsByMetric,
                  pcfAsk,
                )}
              </span>
              <span className="tx-rail__bar" aria-hidden>
                <span style={{ width: `${pct}%` }} />
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
