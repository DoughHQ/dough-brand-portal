import type { ConceptPlanSubject } from './planTypes'
import { humanRecapTitle } from './recapLabels'

export type RecapAnswerKind = 'screener' | 'reaction' | 'followup'

export type RecapSubject = {
  ref: number
  name: string
  kind?: string
  image_url?: string | null
  image_unavailable?: boolean
}

export type RecapAnswer = {
  kind: RecapAnswerKind
  title: string
  values: string[]
  subject?: RecapSubject | null
}

export type RecapBattles = {
  total: number
  wins: number
  headline: string
  subject: RecapSubject | null
}

export type RecapReactionGroup = {
  key: string
  subject: RecapSubject | null
  answers: RecapAnswer[]
}

export type RecapModel = {
  battles: RecapBattles | null
  aboutYou: RecapAnswer[]
  alongTheWay: RecapAnswer[]
  reactions: RecapReactionGroup[]
  isEmpty: boolean
}

export function subjectFromPlan(
  subject: ConceptPlanSubject | null | undefined
): RecapSubject | null {
  if (!subject || typeof subject.ref !== 'number') return null
  return {
    ref: subject.ref,
    name: (subject.name ?? `Option ${subject.ref}`).trim() || `Option ${subject.ref}`,
    kind: subject.kind,
    image_url: subject.image_url ?? null,
    image_unavailable: subject.image_unavailable,
  }
}

export function buildRecap(args: {
  battleWins: Map<number, number>
  battleTotal: number
  mostChosen: number | null
  subjects: ReadonlyMap<number, RecapSubject>
  answers: RecapAnswer[]
}): RecapModel {
  let battles: RecapBattles | null = null
  if (args.battleTotal > 0) {
    if (args.mostChosen == null) {
      battles = {
        total: args.battleTotal,
        wins: 0,
        headline: 'No clear pick across the battles.',
        subject: null,
      }
    } else {
      const subject = args.subjects.get(args.mostChosen) ?? {
        ref: args.mostChosen,
        name: `Option ${args.mostChosen}`,
      }
      const wins = args.battleWins.get(args.mostChosen) ?? 0
      battles = {
        total: args.battleTotal,
        wins,
        headline: `You picked ${subject.name} in ${wins} of ${args.battleTotal} battles.`,
        subject,
      }
    }
  }

  const aboutYou = args.answers.filter((a) => a.kind === 'screener')
  const alongTheWay = args.answers.filter((a) => a.kind === 'followup')
  const reactionAnswers = args.answers.filter((a) => a.kind === 'reaction')

  const groups = new Map<string, RecapReactionGroup>()
  for (const answer of reactionAnswers) {
    const key =
      answer.subject != null ? `ref:${answer.subject.ref}` : 'none'
    const existing = groups.get(key)
    if (existing) {
      existing.answers.push(answer)
    } else {
      groups.set(key, {
        key,
        subject: answer.subject ?? null,
        answers: [answer],
      })
    }
  }

  const reactions = [...groups.values()]
  const isEmpty =
    battles == null &&
    aboutYou.length === 0 &&
    alongTheWay.length === 0 &&
    reactions.length === 0

  return { battles, aboutYou, alongTheWay, reactions, isEmpty }
}

export { humanRecapTitle }
