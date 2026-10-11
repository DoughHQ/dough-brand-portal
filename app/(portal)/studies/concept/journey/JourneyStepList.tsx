import type { ConceptStudyDraft } from '@/lib/concept/types'
import { journeyStepCountLabel, whyFollowupCountLabel } from '@/lib/concept/journeyAccordion'
import PackSizeField from '../PackSizeField'
import { ExpectedPriceCard } from '../conceptCards'
import JourneyBattlePrompt from './JourneyBattlePrompt'
import JourneyBoughtRecently from './JourneyBoughtRecently'
import JourneyBrandQuestions from './JourneyBrandQuestions'
import { AccordionRow, AskedList } from './journeyChrome'
import type { useSingleTestJourney } from './useSingleTestJourney'

export default function JourneyStepList({
  draft,
  onChange,
  error,
  state,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  state: ReturnType<typeof useSingleTestJourney>
}) {
  const {
    config,
    openKey,
    fieldErrors,
    patchConfig,
    decoyHint,
    usingCustom,
    customNote,
    brandQuestions,
    brandStart,
    counts,
    fieldSeats,
    fieldOptions,
    setOpenKey,
    howOften,
    boughtLately,
    why,
    screenerCount,
    lineFor,
    askedFor,
    toggleStep,
    bindRow,
  } = state

  return (
    <div className="cb-acc-list">
      <AccordionRow
        id="how_often"
        index="1"
        title="How often"
        line={
          howOften
            ? { kind: 'question', text: howOften.prompt }
            : { kind: 'empty' }
        }
        countLabel={screenerCount}
        open={openKey === 'how_often'}
        onToggle={() => toggleStep('how_often')}
        rowRef={() => {}}
      >
        <AskedList blocks={howOften ? [howOften] : []} />
      </AccordionRow>

      <AccordionRow
        id="screeners"
        index="2"
        title="Bought recently"
        line={lineFor('screeners')}
        countLabel={screenerCount}
        open={openKey === 'screeners'}
        onToggle={() => toggleStep('screeners')}
        rowRef={bindRow('screeners')}
      >
        <AskedList blocks={boughtLately ? [boughtLately] : []} />
        <JourneyBoughtRecently
          config={config}
          patchConfig={patchConfig}
          fieldErrors={fieldErrors}
          decoyHint={decoyHint}
        />
      </AccordionRow>

      <AccordionRow
        id="first_look"
        index="3"
        title="First look"
        line={lineFor('first_look')}
        countLabel={journeyStepCountLabel('first_look', counts)}
        open={openKey === 'first_look'}
        onToggle={() => toggleStep('first_look')}
        rowRef={bindRow('first_look')}
      >
        <AskedList blocks={askedFor('first_look')} />
      </AccordionRow>

      <AccordionRow
        id="battles"
        index="4"
        title="Battles"
        line={lineFor('battles')}
        countLabel={journeyStepCountLabel('battles', counts)}
        open={openKey === 'battles'}
        onToggle={() => toggleStep('battles')}
        rowRef={bindRow('battles')}
      >
        <JourneyBattlePrompt
          draft={draft}
          onChange={onChange}
          usingCustom={usingCustom}
          customNote={customNote}
        />
      </AccordionRow>

      <AccordionRow
        id="why"
        index="5"
        title={why.prompt}
        line={{ kind: 'empty' }}
        countLabel={whyFollowupCountLabel(counts)}
        open={openKey === 'why'}
        onToggle={() => toggleStep('why')}
        rowRef={() => {}}
      >
        <AskedList blocks={[why]} prompt={false} />
      </AccordionRow>

      <AccordionRow
        id="what_matters"
        index="6"
        title="What matters"
        line={lineFor('what_matters')}
        countLabel={journeyStepCountLabel('what_matters', counts)}
        open={openKey === 'what_matters'}
        onToggle={() => toggleStep('what_matters')}
        rowRef={bindRow('what_matters')}
      >
        <AskedList blocks={askedFor('what_matters')} />
      </AccordionRow>

      <AccordionRow
        id="rank"
        index="7"
        title="Rank the field"
        line={lineFor('rank')}
        countLabel={journeyStepCountLabel('rank', counts)}
        open={openKey === 'rank'}
        onToggle={() => toggleStep('rank')}
        rowRef={bindRow('rank')}
      >
        <AskedList blocks={askedFor('rank')} />
      </AccordionRow>

      <AccordionRow
        id="price"
        index="8"
        title="Price"
        line={lineFor('price')}
        countLabel={journeyStepCountLabel('price', counts)}
        open={openKey === 'price'}
        onToggle={() => toggleStep('price')}
        rowRef={bindRow('price')}
      >
        <AskedList blocks={askedFor('price')} />
        <PackSizeField draft={draft} onChange={onChange} />
        <ExpectedPriceCard
          config={config}
          patchConfig={patchConfig}
          errorByField={fieldErrors}
          labelOverride="Expected retail price"
          helpOverride="Bands generate from this anchor. Respondents never see your number as a tag."
        />
      </AccordionRow>

      <JourneyBrandQuestions
        draft={draft}
        onChange={onChange}
        brandQuestions={brandQuestions}
        brandStart={brandStart}
        counts={counts}
        openKey={openKey}
        setOpenKey={setOpenKey}
        fieldSeats={fieldSeats}
        fieldOptions={fieldOptions}
        onToggle={toggleStep}
      />

      <AccordionRow
        id="open_text"
        index={String(brandStart + brandQuestions.length)}
        title="Open text"
        line={lineFor('open_text')}
        countLabel={journeyStepCountLabel('open_text', counts)}
        open={openKey === 'open_text'}
        onToggle={() => toggleStep('open_text')}
        rowRef={bindRow('open_text')}
      >
        <AskedList blocks={askedFor('open_text')} />
      </AccordionRow>

      {error ? (
        <p role="alert" className="cb-acc-alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
