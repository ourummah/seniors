import type { Answers, Benefit } from './types.ts'

// Tags worked out from the answers rather than asked directly.
export function derivedTags(a: Answers): Set<string> {
  const tags = new Set(a.tags)
  const age = a.age ?? 0
  for (const n of [60, 65, 67, 70]) if (age >= n) tags.add(`aged_${n}`)
  if (a.cards.includes('DVA_GOLD') || a.cards.includes('DVA_WHITE')) tags.add('veteran')
  return tags
}

// A benefit matches when it covers the member's state, they hold any one of the listed cards
// (or none is needed; or, when card_sets is given, every card in one of the sets), and every extra requirement is met.
export function matches(b: Benefit, a: Answers): boolean {
  if (b.state !== 'ALL' && b.state !== a.state) return false
  const cardOk = b.card_sets?.length
    ? b.card_sets.some((set) => set.every((c) => c === 'NONE' || a.cards.includes(c)))
    : b.cards.length === 0 || b.cards.includes('NONE') || b.cards.some((c) => a.cards.includes(c))
  if (!cardOk) return false
  const tags = derivedTags(a)
  if ((b.excludes ?? []).some((x) => tags.has(x) || a.cards.includes(x))) return false
  return b.requires.every((r) => tags.has(r))
}

export function matchBenefits(all: Benefit[], a: Answers): Benefit[] {
  return all.filter((b) => matches(b, a))
}

// Headline figure: the sum of known yearly maximums. Benefits without a fixed amount, and large
// means-tested pensions (counts_in_total = false), are left out so the figure is not overstated.
export function estimatedYearlyTotal(list: Benefit[]): number {
  return list.reduce((sum, b) => sum + (b.counts_in_total === false ? 0 : Number(b.max_annual_value ?? 0)), 0)
}

export function formatAud(n: number): string {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })
}
