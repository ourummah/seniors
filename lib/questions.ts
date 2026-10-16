// The member questionnaire. Each option maps to a card code or a tag used by the matching rules.
export type Option = { value: string; label: string; hint?: string }
export type Question =
  | { id: string; kind: 'state'; title: string; help?: string }
  | { id: string; kind: 'number'; title: string; help?: string; min: number; max: number; field: 'age' }
  | { id: string; kind: 'text'; title: string; help?: string; field: 'postcode'; pattern: string }
  | { id: string; kind: 'multi'; title: string; help?: string; field: 'cards' | 'tags'; options: Option[] }
  | { id: string; kind: 'single'; title: string; help?: string; field: 'tags'; options: Option[] }

export const QUESTIONS: Question[] = [
  { id: 'state', kind: 'state', title: 'Which state or territory do you live in?' },
  { id: 'postcode', kind: 'text', title: 'What is your postcode?', help: 'This helps us find local offers.', field: 'postcode', pattern: '^[0-9]{4}$' },
  { id: 'age', kind: 'number', title: 'How old are you?', min: 18, max: 120, field: 'age' },
  {
    id: 'cards', kind: 'multi', field: 'cards', title: 'Which cards do you have?', help: 'Tick all that apply.',
    options: [
      { value: 'PCC', label: 'Pensioner Concession Card', hint: 'Blue card from Centrelink' },
      { value: 'CSHC', label: 'Commonwealth Seniors Health Card' },
      { value: 'HCC', label: 'Health Care Card' },
      { value: 'SENIORS_CARD', label: 'State Seniors Card' },
      { value: 'DVA_GOLD', label: 'Veterans Gold Card' },
      { value: 'DVA_WHITE', label: 'Veterans White Card' },
    ],
  },
  {
    id: 'pension', kind: 'multi', field: 'tags', title: 'Do you get any of these payments?', help: 'Tick all that apply.',
    options: [
      { value: 'age_pension', label: 'Age Pension' },
      { value: 'veteran', label: 'A veterans pension' },
    ],
  },
  {
    id: 'home', kind: 'single', field: 'tags', title: 'Do you own or rent your home?',
    options: [
      { value: 'homeowner', label: 'I own my home' },
      { value: 'renter', label: 'I rent' },
      { value: 'other_housing', label: 'Something else', hint: 'For example, living with family or in a retirement village' },
    ],
  },
  {
    id: 'household', kind: 'single', field: 'tags', title: 'Who do you live with?',
    options: [
      { value: 'lives_alone', label: 'I live alone' },
      { value: 'with_partner', label: 'With my partner' },
      { value: 'with_others', label: 'With family or others' },
    ],
  },
  {
    id: 'bills', kind: 'multi', field: 'tags', title: 'Which bills are in your name?', help: 'Tick all that apply.',
    options: [
      { value: 'electricity_account', label: 'Electricity' },
      { value: 'gas_account', label: 'Gas' },
      { value: 'water_account', label: 'Water' },
    ],
  },
  {
    id: 'car', kind: 'single', field: 'tags', title: 'Do you have a car registered in your name?',
    options: [
      { value: 'car_owner', label: 'Yes' },
      { value: 'no_car', label: 'No' },
    ],
  },
  {
    id: 'health', kind: 'multi', field: 'tags', title: 'Do any of these apply to you or your household?', help: 'Tick all that apply. Skip if none.',
    options: [
      { value: 'life_support', label: 'Uses life support equipment at home', hint: 'For example, oxygen or a dialysis machine' },
      { value: 'medical_condition', label: 'A medical condition made worse by heat or cold', hint: 'For example, MS or Parkinson’s' },
      { value: 'mobility_need', label: 'Trouble getting around or using public transport' },
      { value: 'hearing_need', label: 'Hearing loss' },
      { value: 'carer', label: 'I look after someone who is ill, frail or has a disability' },
    ],
  },
  {
    id: 'where', kind: 'single', field: 'tags', title: 'Do you live in the city or the country?',
    options: [
      { value: 'city', label: 'City or suburbs' },
      { value: 'rural', label: 'Country or remote area' },
    ],
  },
  {
    id: 'money', kind: 'multi', field: 'tags', title: 'Is money tight right now?', help: 'This helps us show emergency help. Skip if not.',
    options: [
      { value: 'hardship', label: 'I am behind on a bill or struggling to pay one' },
      { value: 'low_income', label: 'I am on a low income' },
    ],
  },
]
