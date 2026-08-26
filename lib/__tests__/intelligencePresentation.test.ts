import { describe, expect, it } from 'vitest'
import {
  battleLevelLabel,
  buildHeadToHeadJobs,
  formatBattleRecord,
  formatEloScore,
  formatJobRank,
  intelligenceVolumeStats,
  jobStatusCopy,
  pickHeadlineStanding,
  raterFloorCopy,
} from '../../app/(portal)/products/[productId]/tabs/intelligencePresentation'
import type {
  CompareGroupEligible,
  CompareGroupResult,
} from '../productMaster/types'

function eligible(partial: Partial<CompareGroupEligible>): CompareGroupEligible {
  return {
    compare_group_id: 1,
    name: 'Greek yogurt',
    consumer_question: 'Which Greek yogurt tastes better?',
    battle_level: '2',
    has_results: false,
    ...partial,
  }
}

function result(partial: Partial<CompareGroupResult>): CompareGroupResult {
  return {
    compare_group_id: 1,
    name: 'Greek yogurt',
    consumer_question: 'Which Greek yogurt tastes better?',
    elo_score: 1421.4,
    battles: 40,
    battles_won: 12,
    job_rank: 4,
    job_total: 40,
    rank_comparable: true,
    component_id: 9,
    maturity: 0.42,
    seed_source: 'organic',
    confidence_interval: null,
    publishable: false,
    ...partial,
  }
}

describe('intelligence formatters', () => {
  it('rounds Elo and never invents a rank without comparable integers', () => {
    expect(formatEloScore(1421.4)).toBe('1421')
    expect(formatEloScore(null)).toBeNull()
    expect(formatJobRank(4, 40, true)).toBe('4th of 40')
    expect(formatJobRank(4, 40, false)).toBeNull()
    expect(formatJobRank(4, 40, null)).toBeNull()
    expect(formatJobRank(4, null, true)).toBeNull()
  })

  it('formats a win record only from coherent battle counts', () => {
    expect(formatBattleRecord(12, 40)).toBe('12 won · 40 battles')
    expect(formatBattleRecord(null, 1)).toBe('1 battle')
    expect(formatBattleRecord(50, 40)).toBeNull()
    expect(formatBattleRecord(null, null)).toBeNull()
  })

  it('labels a numeric battle level without inventing L1/L2 names', () => {
    expect(battleLevelLabel(2)).toBe('Level 2')
    expect(battleLevelLabel('3')).toBe('Level 3')
    expect(battleLevelLabel(0)).toBeNull()
    expect(battleLevelLabel(null)).toBeNull()
  })
})

describe('buildHeadToHeadJobs', () => {
  it('lists eligible jobs for brands without attaching scores when results are null', () => {
    const jobs = buildHeadToHeadJobs(
      [eligible({ has_results: true })],
      null
    )
    expect(jobs).toHaveLength(1)
    expect(jobs[0].question).toBe('Which Greek yogurt tastes better?')
    expect(jobs[0].setName).toBe('Greek yogurt')
    expect(jobs[0].hasResultsFlag).toBe(true)
    expect(jobs[0].standings).toEqual([])
    expect(jobStatusCopy(jobs[0], false)).toMatch(/aren’t published/i)
  })

  it('joins admin results onto the matching job and keeps orphan result groups', () => {
    const jobs = buildHeadToHeadJobs(
      [eligible({ compare_group_id: 1 }), eligible({ compare_group_id: 2, has_results: false, name: 'Skyr', consumer_question: 'Which skyr?' })],
      [
        result({ compare_group_id: 1 }),
        result({
          compare_group_id: 99,
          name: 'Orphan job',
          consumer_question: 'Which leftover?',
          job_rank: 1,
          job_total: 8,
        }),
      ]
    )
    expect(jobs).toHaveLength(3)
    expect(jobs[0].standings[0]).toMatchObject({
      eloLabel: '1421',
      rankLabel: '4th of 40',
      recordLabel: '12 won · 40 battles',
    })
    expect(jobs[1].standings).toEqual([])
    expect(jobs[2].compareGroupId).toBe(99)
    expect(jobs[2].question).toBe('Which leftover?')
  })
})

describe('headline and volume', () => {
  it('picks the best comparable rank as the headline standing', () => {
    const jobs = buildHeadToHeadJobs(
      [eligible({ compare_group_id: 1 }), eligible({ compare_group_id: 2, consumer_question: 'Which is healthier?' })],
      [
        result({ compare_group_id: 1, job_rank: 8, job_total: 20, elo_score: 1500 }),
        result({
          compare_group_id: 2,
          consumer_question: 'Which is healthier?',
          job_rank: 2,
          job_total: 11,
          elo_score: 1100,
        }),
      ]
    )
    expect(pickHeadlineStanding(jobs)).toMatchObject({
      question: 'Which is healthier?',
      rankLabel: '2nd of 11',
      eloLabel: '1100',
    })
  })

  it('does not headline a rank that is not comparable', () => {
    const jobs = buildHeadToHeadJobs(
      [eligible({})],
      [result({ rank_comparable: false, job_rank: 1, job_total: 4 })]
    )
    expect(pickHeadlineStanding(jobs)).toBeNull()
  })

  it('omits null volume stats and reports the rater floor from the payload', () => {
    expect(
      intelligenceVolumeStats({
        admin_only: true,
        unique_raters: 12,
        total_battles: 40,
        min_raters_to_publish: 25,
        taste_score: 88.2,
        health_score: null,
      }).map((s) => s.key)
    ).toEqual(['raters', 'battles', 'taste'])
    expect(
      raterFloorCopy({
        admin_only: true,
        unique_raters: 12,
        total_battles: 40,
        min_raters_to_publish: 25,
        taste_score: null,
        health_score: null,
      })
    ).toBe('12 of 25 unique raters toward a publishable score')
  })
})
