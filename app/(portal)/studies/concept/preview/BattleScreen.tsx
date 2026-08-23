import { useState } from 'react'
import type { ConceptBattleOutcome, ConceptBattleScreenPlan } from '@/lib/concept/preview/planTypes'
import { shouldSuppressCombatantLabels } from '@/lib/concept/preview/planTypes'
import {
  layoutCombatantRefs,
  outcomeForCardTap,
} from '@/lib/concept/preview/sessionWins'

type Props = {
  screen: ConceptBattleScreenPlan
  stimulusMode: string | null
  showOrderNote: boolean
  onOutcome: (outcome: ConceptBattleOutcome) => void
}

function Tile({
  name,
  imageUrl,
  price,
  suppressName,
  picked,
  onPick,
}: {
  name: string
  imageUrl: string | null | undefined
  price: number | null | undefined
  suppressName: boolean
  picked: boolean
  onPick: () => void
}) {
  return (
    <button type="button" className="cpw-tile" data-picked={picked} onClick={onPick}>
      <div className="cpw-tile-image">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage / catalog URL
          <img src={imageUrl} alt={suppressName ? '' : name} />
        ) : (
          <span className="cpw-tile-ph">No image</span>
        )}
      </div>
      {!suppressName || price != null ? (
        <div className="cpw-tile-meta">
          {!suppressName ? <div className="cpw-tile-name">{name}</div> : null}
          {price != null ? (
            <div className="cpw-tile-price">${price.toFixed(2)}</div>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}

export default function BattleScreen({
  screen,
  stimulusMode,
  showOrderNote,
  onOutcome,
}: Props) {
  const [picked, setPicked] = useState<'left' | 'right' | 'neither' | 'skip' | null>(
    null
  )
  const suppress = shouldSuppressCombatantLabels({
    stimulusMode,
    config: screen.config,
  })
  const { leftRef, rightRef } = layoutCombatantRefs(
    screen.presented_position,
    screen.combatant_ref_a,
    screen.combatant_ref_b
  )
  const left = leftRef === screen.combatant_ref_a ? screen.combatant_a : screen.combatant_b
  const right = rightRef === screen.combatant_ref_b ? screen.combatant_b : screen.combatant_a

  function choose(side: 'left' | 'right') {
    setPicked(side)
    onOutcome(outcomeForCardTap(side, screen.presented_position))
  }

  return (
    <div>
      {showOrderNote ? (
        <p className="cpw-help">
          Respondents see these same battles in a randomized order and left/right
          position — this is one representative arrangement.
        </p>
      ) : null}
      <h2 className="cpw-prompt">{screen.prompt || 'Which one would you reach for?'}</h2>
      <div className="cpw-tiles">
        <Tile
          name={left?.name ?? `Option ${leftRef}`}
          imageUrl={left?.image_url}
          price={left?.price}
          suppressName={suppress}
          picked={picked === 'left'}
          onPick={() => choose('left')}
        />
        <Tile
          name={right?.name ?? `Option ${rightRef}`}
          imageUrl={right?.image_url}
          price={right?.price}
          suppressName={suppress}
          picked={picked === 'right'}
          onPick={() => choose('right')}
        />
      </div>
      <div className="cpw-abstain">
        <button
          type="button"
          className="cpw-ghost"
          data-picked={picked === 'neither'}
          onClick={() => {
            setPicked('neither')
            onOutcome('NEITHER')
          }}
        >
          Neither
        </button>
        <button
          type="button"
          className="cpw-ghost"
          data-picked={picked === 'skip'}
          onClick={() => {
            setPicked('skip')
            onOutcome('SKIP')
          }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
