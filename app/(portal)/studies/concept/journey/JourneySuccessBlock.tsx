import { formatPriceDisplay, normalizeExpectedPrice } from '@/lib/concept/priceBands'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { journeyStepDone } from '@/lib/concept/journeyAccordion'
import { AccordionRow } from './journeyChrome'
import JourneySuccessBars from './JourneySuccessBars'
import type { useSingleTestJourney } from './useSingleTestJourney'

export default function JourneySuccessBlock({
  draft,
  state,
}: {
  draft: ConceptStudyDraft
  state: ReturnType<typeof useSingleTestJourney>
}) {
  const { bars, config, openKey, lineFor, toggleStep, bindRow, patchBars } = state
  return (
    <div className="cb-report-block">
      <p className="cb-acc-note">Respondents never see this.</p>
      <AccordionRow
        id="success"
        index={null}
        title="When do you win?"
        line={lineFor('success')}
        countLabel={null}
        mark={journeyStepDone('success', draft)}
        open={openKey === 'success'}
        measures="Set the bar for the report. Shoppers never see these."
        onToggle={() => toggleStep('success')}
        rowRef={bindRow('success')}
      >
        <JourneySuccessBars
          bars={bars}
          priceLabel={
            formatPriceDisplay(
              normalizeExpectedPrice(config.expected_price) || config.price_display
            ) || null
          }
          onChange={patchBars}
        />
      </AccordionRow>
    </div>
  )
}
