import { DEFAULT_DECOY_OPTION } from '@/lib/concept/singleTest'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { VerificationCard } from '../conceptCards'

export default function JourneyBoughtRecently({
  config,
  patchConfig,
  fieldErrors,
  decoyHint,
}: {
  config: ConceptStudyDraft['templateConfig']
  patchConfig: (partial: Partial<ConceptStudyDraft['templateConfig']>) => void
  fieldErrors: Map<string, string>
  decoyHint: string | null
}) {
  return (
    <>
      <VerificationCard
        config={config}
        patchConfig={patchConfig}
        errorByField={fieldErrors}
      />
      {!config.decoy_option.trim() ? (
        <button
          type="button"
          className="cb-quiet-action"
          onClick={() => patchConfig({ decoy_option: DEFAULT_DECOY_OPTION })}
        >
          Prefill decoy ({DEFAULT_DECOY_OPTION})
        </button>
      ) : null}
      {decoyHint ? (
        <p role="alert" className="cb-acc-alert">
          Decoy: {decoyHint}
        </p>
      ) : null}
    </>
  )
}
