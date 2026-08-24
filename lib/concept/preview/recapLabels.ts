/** Short titles for known protocol labels. Unknown labels are humanized, never shown raw. */
const LABEL_TITLES: Record<string, string> = {
  category_frequency: 'How often you buy this category',
  purchase_verification: 'What you buy today',
  category_legibility: 'What this looks like',
  price_expectation: "What you'd expect to pay",
  audience_fit: 'Who this looks like it’s for',
  choice_driver: 'Why you picked it',
  purchase_floor: 'Would you buy it',
  purchase_intent: 'Would you buy it',
  honest_thoughts: 'Anything that put you off',
  wtp_per_arm: 'What you’d pay',
  trial_vs_regular: 'Try once or buy regularly',
  when_where: 'When or where you’d use this',
  why: 'Why this one',
  screener: 'A quick check',
}

export function humanizeRecapKey(raw: string): string {
  const t = raw.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  if (!t) return 'Answer'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function looksLikeRawKey(value: string): boolean {
  return /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(value.trim())
}

export function humanRecapTitle(args: {
  label?: string | null
  prompt?: string | null
  fallback?: string
}): string {
  const label = (args.label ?? '').trim()
  if (label && LABEL_TITLES[label]) return LABEL_TITLES[label]
  const prompt = (args.prompt ?? '').trim()
  if (prompt) return prompt
  if (label) return humanizeRecapKey(label)
  return args.fallback ?? 'Answer'
}
