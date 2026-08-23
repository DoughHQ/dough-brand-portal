import type { ConceptPlanScreen } from './planTypes'

export type RecapLine = { text: string }

export function buildRecap(args: {
  screens: ConceptPlanScreen[]
  battleWins: Map<number, number>
  battleTotal: number
  combatantNames: Map<number, string>
  choiceLines: RecapLine[]
  mostChosen: number | null
}): RecapLine[] {
  const lines: RecapLine[] = []
  if (args.battleTotal > 0) {
    if (args.mostChosen == null) {
      lines.push({ text: 'In your walkthrough: no clear pick across the battles.' })
    } else {
      const name = args.combatantNames.get(args.mostChosen) ?? `Option ${args.mostChosen}`
      const wins = args.battleWins.get(args.mostChosen) ?? 0
      lines.push({
        text: `In your walkthrough: you picked ${name} in ${wins} of ${args.battleTotal} battles.`,
      })
    }
  }
  lines.push(...args.choiceLines)
  return lines
}
