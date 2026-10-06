/**
 * CONCEPT_CORE_V1 report — pure renderer of report_concept_test.json shape.
 * CONCEPT_CORE_V1 verdict payload.
 */

export type ConceptTestVerdictResult =
  | 'cleared'
  | 'not_cleared'
  | 'too_close_to_call'
  | 'not_enough_responses'
  | string

export type ConceptTestInterval = {
  lo: number
  hi: number
  bar: number
  result: ConceptTestVerdictResult
  dough_default: number
}

export type ConceptTestVerdict = {
  ref: number
  name: string
  overall: ConceptTestVerdictResult
  head_to_head: ConceptTestInterval & {
    wins: number
    losses: number
    neither: number
    win_share: number
    /** Equal-field report: respondents are the unit. */
    n_respondents: number
    basis?: 'field' | string
    /** Legacy benchmark-paired shape. Prefer n_respondents. */
    n_decisive?: number
  }
  liking: ConceptTestInterval & {
    mode: string
    n_paired?: number
    difference_top_two?: number
  }
  price: ConceptTestInterval & {
    n: number
    anchor: number
    share_generous: number
    share_conservative: number
  }
}

export type ConceptWhatMattersItem = {
  value: string
  label: string
  utility: number | null
  std_error: number | null
  rank: number | null
  times_best: number | null
  times_worst: number | null
}

export type ConceptTestReport = {
  flow: string
  sample: {
    n_started: number
    n_completed: number
    n_screened_out: number
    n_battles_excluded_for_timing: number
  }
  benchmark: { ref: number; name: string; role: string } | null
  bars: Record<string, unknown> | null
  verdict: ConceptTestVerdict[]
  first_look: Array<{
    ref: number
    name: string
    n: number
    is_benchmark: boolean
    top_box: { share: number; lo: number; hi: number }
    top_two: { share: number; lo: number; hi: number }
    distribution: Array<{ label: string; n: number; share: number }>
  }>
  what_matters: {
    note?: string
    detail?: string
    n_respondents?: number
    method?: string
    fallback_reason?: string
    items: ConceptWhatMattersItem[]
  } | null
  stated_vs_chosen: {
    n_rankings: number
    top_pick_agreement: number
    mean_pair_agreement: number
    n_top_pick_comparable: number
  } | null
  price: Array<{
    ref: number
    name: string
    is_benchmark: boolean
    report: {
      modal_band?: { label: string } | null
      demand_curve?: Array<{ price: number; share_would_pay_gte: number }>
      rejection_rate?: number
      n_answers?: number
      presentation_rule?: string
      below_reporting_floor?: boolean
    }
  }>
  brand_questions: Array<{
    prompt: string
    framing?: string
    brand_written?: boolean
    n: number
    options: Array<{ option: string; n: number }>
  }>
  open_text: {
    answers: Array<{
      text: string
      first_look?: Record<string, string>
    }>
    scrub_note?: string
  } | null
  method: Record<string, string> | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

/** True when payload is the single-test report shape (not legacy win_rate_field). */
export function isConceptTestReportPayload(payload: unknown): boolean {
  const r = asRecord(payload)
  if (!r) return false
  if (r.flow === 'concept_core_v1') return true
  if (Array.isArray(r.verdict) && !Array.isArray(r.win_rate_field)) return true
  return false
}

export function parseConceptTestReport(
  payload: unknown,
): ConceptTestReport | null {
  const r = asRecord(payload)
  if (!r || !Array.isArray(r.verdict)) return null

  const sample = asRecord(r.sample) ?? {}
  const benchmark = asRecord(r.benchmark)

  return {
    flow: str(r.flow, 'concept_core_v1'),
    sample: {
      n_started: num(sample.n_started),
      n_completed: num(sample.n_completed),
      n_screened_out: num(sample.n_screened_out),
      n_battles_excluded_for_timing: num(sample.n_battles_excluded_for_timing),
    },
    benchmark: benchmark
      ? {
          ref: num(benchmark.ref),
          name: str(benchmark.name),
          role: str(benchmark.role),
        }
      : null,
    bars: asRecord(r.bars),
    verdict: (r.verdict as unknown[]).map((row) => {
      const v = asRecord(row) ?? {}
      const h2h = asRecord(v.head_to_head) ?? {}
      const liking = asRecord(v.liking) ?? {}
      const price = asRecord(v.price) ?? {}
      return {
        ref: num(v.ref),
        name: str(v.name),
        overall: str(
          v.overall,
          'too_close_to_call',
        ) as ConceptTestVerdictResult,
        head_to_head: {
          lo: num(h2h.lo),
          hi: num(h2h.hi),
          bar: num(h2h.bar),
          result: str(h2h.result) as ConceptTestVerdictResult,
          dough_default: num(h2h.dough_default),
          wins: num(h2h.wins),
          losses: num(h2h.losses),
          neither: num(h2h.neither),
          win_share: num(h2h.win_share),
          n_respondents: num(h2h.n_respondents ?? h2h.n_decisive),
          basis: typeof h2h.basis === 'string' ? h2h.basis : undefined,
          n_decisive:
            typeof h2h.n_decisive === 'number' ? h2h.n_decisive : undefined,
        },
        liking: {
          lo: num(liking.lo),
          hi: num(liking.hi),
          bar: num(liking.bar),
          result: str(liking.result) as ConceptTestVerdictResult,
          dough_default: num(liking.dough_default),
          mode: str(liking.mode),
          n_paired:
            typeof liking.n_paired === 'number' ? liking.n_paired : undefined,
          difference_top_two:
            typeof liking.difference_top_two === 'number'
              ? liking.difference_top_two
              : undefined,
        },
        price: {
          lo: num(price.lo),
          hi: num(price.hi),
          bar: num(price.bar),
          result: str(price.result) as ConceptTestVerdictResult,
          dough_default: num(price.dough_default),
          n: num(price.n),
          anchor: num(price.anchor),
          share_generous: num(price.share_generous),
          share_conservative: num(price.share_conservative),
        },
      }
    }),
    first_look: Array.isArray(r.first_look)
      ? (r.first_look as unknown[]).map((row) => {
          const v = asRecord(row) ?? {}
          const topBox = asRecord(v.top_box) ?? {}
          const topTwo = asRecord(v.top_two) ?? {}
          return {
            ref: num(v.ref),
            name: str(v.name),
            n: num(v.n),
            is_benchmark: v.is_benchmark === true,
            top_box: {
              share: num(topBox.share),
              lo: num(topBox.lo),
              hi: num(topBox.hi),
            },
            top_two: {
              share: num(topTwo.share),
              lo: num(topTwo.lo),
              hi: num(topTwo.hi),
            },
            distribution: Array.isArray(v.distribution)
              ? (v.distribution as unknown[]).map((d) => {
                  const x = asRecord(d) ?? {}
                  return {
                    label: str(x.label),
                    n: num(x.n),
                    share: num(x.share),
                  }
                })
              : [],
          }
        })
      : [],
    what_matters: asRecord(r.what_matters)
      ? {
          note: str(asRecord(r.what_matters)!.note) || undefined,
          detail: str(asRecord(r.what_matters)!.detail) || undefined,
          n_respondents:
            typeof asRecord(r.what_matters)!.n_respondents === 'number'
              ? num(asRecord(r.what_matters)!.n_respondents)
              : undefined,
          method: str(asRecord(r.what_matters)!.method) || undefined,
          fallback_reason:
            str(asRecord(r.what_matters)!.fallback_reason) || undefined,
          items: Array.isArray(asRecord(r.what_matters)!.items)
            ? (asRecord(r.what_matters)!.items as unknown[]).map((item) => {
                const x = asRecord(item) ?? {}
                return {
                  value: str(x.value),
                  label: str(x.label, str(x.value)),
                  utility:
                    typeof x.utility === 'number' ? num(x.utility) : null,
                  std_error:
                    typeof x.std_error === 'number' ? num(x.std_error) : null,
                  rank: typeof x.rank === 'number' ? num(x.rank) : null,
                  times_best:
                    typeof x.times_best === 'number' ? num(x.times_best) : null,
                  times_worst:
                    typeof x.times_worst === 'number'
                      ? num(x.times_worst)
                      : null,
                }
              })
            : [],
        }
      : null,
    stated_vs_chosen: asRecord(r.stated_vs_chosen)
      ? {
          n_rankings: num(asRecord(r.stated_vs_chosen)!.n_rankings),
          top_pick_agreement: num(
            asRecord(r.stated_vs_chosen)!.top_pick_agreement,
          ),
          mean_pair_agreement: num(
            asRecord(r.stated_vs_chosen)!.mean_pair_agreement,
          ),
          n_top_pick_comparable: num(
            asRecord(r.stated_vs_chosen)!.n_top_pick_comparable,
          ),
        }
      : null,
    price: Array.isArray(r.price)
      ? (r.price as unknown[]).map((row) => {
          const v = asRecord(row) ?? {}
          const report = asRecord(v.report) ?? {}
          const modal = asRecord(report.modal_band)
          return {
            ref: num(v.ref),
            name: str(v.name),
            is_benchmark: v.is_benchmark === true,
            report: {
              modal_band: modal ? { label: str(modal.label) } : null,
              demand_curve: Array.isArray(report.demand_curve)
                ? (report.demand_curve as unknown[]).map((c) => {
                    const x = asRecord(c) ?? {}
                    return {
                      price: num(x.price),
                      share_would_pay_gte: num(x.share_would_pay_gte),
                    }
                  })
                : undefined,
              rejection_rate:
                typeof report.rejection_rate === 'number'
                  ? report.rejection_rate
                  : undefined,
              n_answers:
                typeof report.n_answers === 'number'
                  ? report.n_answers
                  : undefined,
              presentation_rule: str(report.presentation_rule) || undefined,
              below_reporting_floor: report.below_reporting_floor === true,
            },
          }
        })
      : [],
    brand_questions: Array.isArray(r.brand_questions)
      ? (r.brand_questions as unknown[]).map((row) => {
          const v = asRecord(row) ?? {}
          return {
            prompt: str(v.prompt),
            framing: str(v.framing) || undefined,
            brand_written: v.brand_written === true,
            n: num(v.n),
            options: Array.isArray(v.options)
              ? (v.options as unknown[]).map((o) => {
                  const x = asRecord(o) ?? {}
                  return { option: str(x.option), n: num(x.n) }
                })
              : [],
          }
        })
      : [],
    open_text: asRecord(r.open_text)
      ? {
          answers: Array.isArray(asRecord(r.open_text)!.answers)
            ? (asRecord(r.open_text)!.answers as unknown[]).map((a) => {
                const x = asRecord(a) ?? {}
                return {
                  text: str(x.text),
                  first_look: asRecord(x.first_look) as
                    | Record<string, string>
                    | undefined,
                }
              })
            : [],
          scrub_note: str(asRecord(r.open_text)!.scrub_note) || undefined,
        }
      : null,
    method: asRecord(r.method) as Record<string, string> | null,
  }
}

/**
 * The production RPC wraps CONCEPT_CORE_V1 under `concept_test`; previews and
 * older snapshots may expose it directly or under `report` / `data`.
 */
export function parseConceptTestEnvelope(
  payload: unknown,
): ConceptTestReport | null {
  const outer = asRecord(payload)
  const candidates = [payload, outer?.concept_test, outer?.report, outer?.data]
  for (const candidate of candidates) {
    if (isConceptTestReportPayload(candidate)) {
      return parseConceptTestReport(candidate)
    }
    const nested = asRecord(candidate)
    if (isConceptTestReportPayload(nested?.concept_test)) {
      return parseConceptTestReport(nested?.concept_test)
    }
  }
  return null
}
