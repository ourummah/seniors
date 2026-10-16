import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matches, estimatedYearlyTotal, derivedTags } from './match.ts'
import type { Benefit, Answers } from './types.ts'

const base: Benefit = {
  id: 'X', name: 'X', provider: 'X', level: 'State', state: 'VIC', category: 'Bills', summary: '',
  cards: ['PCC'], requires: ['homeowner'], eligibility_text: '', value_text: '', max_annual_value: 266,
  value_period: null, how_to_claim: '', phone: null, source_url: 'https://example.gov.au', notes: null,
}
const vicOwner: Answers = { state: 'VIC', age: 70, cards: ['PCC'], tags: ['homeowner'] }

test('matches state, card and requirement', () => {
  assert.equal(matches(base, vicOwner), true)
})
test('wrong state does not match', () => {
  assert.equal(matches(base, { ...vicOwner, state: 'NSW' }), false)
})
test('federal benefits match every state', () => {
  assert.equal(matches({ ...base, state: 'ALL' }, { ...vicOwner, state: 'NT' }), true)
})
test('missing card does not match', () => {
  assert.equal(matches(base, { ...vicOwner, cards: ['SENIORS_CARD'] }), false)
})
test('NONE card means anyone qualifies', () => {
  assert.equal(matches({ ...base, cards: ['NONE'] }, { ...vicOwner, cards: [] }), true)
})
test('card sets need every card in one set', () => {
  const b = { ...base, card_sets: [['PCC'], ['SENIORS_CARD', 'CSHC']] }
  assert.equal(matches(b, { ...vicOwner, cards: ['SENIORS_CARD'] }), false)
  assert.equal(matches(b, { ...vicOwner, cards: ['SENIORS_CARD', 'CSHC'] }), true)
  assert.equal(matches(b, vicOwner), true)
})
test('missing requirement does not match', () => {
  assert.equal(matches(base, { ...vicOwner, tags: ['renter'] }), false)
})
test('age tags are derived', () => {
  const t = derivedTags({ state: 'SA', age: 67, cards: ['DVA_GOLD'], tags: [] })
  assert.ok(t.has('aged_60') && t.has('aged_67') && !t.has('aged_70') && t.has('veteran'))
})
test('excludes hide what the member already has', () => {
  const pension = { ...base, state: 'ALL' as const, cards: ['NONE'], requires: ['aged_67'], excludes: ['age_pension'] }
  assert.equal(matches(pension, { ...vicOwner, tags: [] }), true)
  assert.equal(matches(pension, { ...vicOwner, tags: ['age_pension'] }), false)
  assert.equal(matches({ ...base, excludes: ['PCC'] }, vicOwner), false)
})
test('pensions are left out of the total', () => {
  assert.equal(estimatedYearlyTotal([base, { ...base, max_annual_value: 30000, counts_in_total: false }]), 266)
})
test('total skips unknown amounts', () => {
  assert.equal(estimatedYearlyTotal([base, { ...base, max_annual_value: null }, { ...base, max_annual_value: 50 }]), 316)
})
