export const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const
export type State = (typeof STATES)[number]

export const STATE_NAMES: Record<State, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
  NT: 'Northern Territory',
}

export const CATEGORIES = ['Payments', 'Bills', 'Transport', 'Health', 'Home and Rates', 'Discounts'] as const
export type Category = (typeof CATEGORIES)[number]

export type Benefit = {
  id: string
  name: string
  provider: string
  level: 'Federal' | 'State' | 'Council' | 'Private'
  state: State | 'ALL'
  category: Category
  summary: string
  cards: string[]
  card_sets?: string[][] | null
  requires: string[]
  excludes?: string[]
  counts_in_total?: boolean
  eligibility_text: string
  value_text: string
  max_annual_value: number | null
  value_period: string | null
  how_to_claim: string
  phone: string | null
  source_url: string
  notes: string | null
  status?: 'draft' | 'published' | 'retired'
  verified?: boolean
  verified_at?: string | null
  updated_at?: string
}

export type Answers = {
  state: State
  postcode?: string | null
  age?: number | null
  cards: string[]
  tags: string[]
}

export type ClaimStatus = 'not_claimed' | 'applied' | 'receiving' | 'not_eligible'

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  not_claimed: 'Not claimed yet',
  applied: 'Applied',
  receiving: 'Receiving',
  not_eligible: 'Not for me',
}

export type Offer = {
  id: string
  business_id: string
  title: string
  description: string
  discount_text: string
  states: string[]
  postcodes: string | null
  starts_on: string
  ends_on: string | null
  redeem_method: 'code' | 'link' | 'show_card' | 'other'
  redeem_details: string | null
  image_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  views: number
  clicks: number
  businesses?: { name: string; website: string | null } | null
}
