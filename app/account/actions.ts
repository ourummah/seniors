'use server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMemberContext, ACT_FOR_COOKIE } from '@/lib/member.ts'
import { createServiceClient } from '@/lib/supabase/server.ts'
import { STATES, type ClaimStatus } from '@/lib/types.ts'
import { QUESTIONS } from '@/lib/questions.ts'

const KNOWN_CARDS = new Set(QUESTIONS.flatMap((q) => (q.kind === 'multi' && q.field === 'cards' ? q.options.map((o) => o.value) : [])))
const KNOWN_TAGS = new Set(QUESTIONS.flatMap((q) => ((q.kind === 'multi' || q.kind === 'single') && q.field === 'tags' ? q.options.map((o) => o.value) : [])))

export async function saveAnswers(formData: FormData) {
  const { supabase, memberId } = await getMemberContext()
  const state = String(formData.get('state') ?? '')
  if (!(STATES as readonly string[]).includes(state)) redirect('/account/questions?error=state')
  const ageRaw = Number(formData.get('age'))
  const postcode = String(formData.get('postcode') ?? '').trim()
  const cards = formData.getAll('cards').map(String).filter((c) => KNOWN_CARDS.has(c))
  // Multi-choice answers arrive as "tags"; one-choice answers as "tags__<question id>".
  const tags = [...formData.entries()]
    .filter(([k]) => k === 'tags' || k.startsWith('tags__'))
    .map(([, v]) => String(v))
    .filter((t) => KNOWN_TAGS.has(t))
  const { error } = await supabase.from('member_answers').upsert({
    member_id: memberId,
    state,
    postcode: /^\d{4}$/.test(postcode) ? postcode : null,
    age: Number.isFinite(ageRaw) && ageRaw >= 18 && ageRaw <= 120 ? Math.round(ageRaw) : null,
    cards,
    tags,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error('Could not save your answers')
  revalidatePath('/account')
  redirect('/account')
}

export async function setClaimStatus(formData: FormData) {
  const { supabase, memberId } = await getMemberContext()
  const benefitId = String(formData.get('benefit_id'))
  const status = String(formData.get('status')) as ClaimStatus
  if (!['not_claimed', 'applied', 'receiving', 'not_eligible'].includes(status)) return
  await supabase.from('member_benefits').upsert({ member_id: memberId, benefit_id: benefitId, status, updated_at: new Date().toISOString() })
  revalidatePath('/account')
  revalidatePath(`/account/benefits/${benefitId}`)
}

export async function saveAlertSettings(formData: FormData) {
  const { supabase, user } = await getMemberContext()
  await supabase.from('profiles').update({
    full_name: String(formData.get('full_name') ?? '').trim() || null,
    alert_email: formData.get('alert_email') === 'on',
    alert_sms: formData.get('alert_sms') === 'on',
  }).eq('id', user.id)
  revalidatePath('/account/settings')
}

export async function inviteHelper(formData: FormData) {
  const { supabase, user } = await getMemberContext()
  const email = String(formData.get('helper_email') ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return
  // Link straight away if the helper already has an account.
  const { data: existing } = await createServiceClient().from('profiles').select('id').ilike('email', email).maybeSingle()
  await supabase.from('member_helpers').upsert({ member_id: user.id, helper_email: email, helper_id: existing?.id ?? null })
  revalidatePath('/account/settings')
}

export async function removeHelper(formData: FormData) {
  const { supabase, user } = await getMemberContext()
  await supabase.from('member_helpers').delete().eq('member_id', user.id).eq('helper_email', String(formData.get('helper_email')))
  revalidatePath('/account/settings')
}

export async function actFor(formData: FormData) {
  const target = String(formData.get('member_id') ?? '')
  const jar = await cookies()
  if (target) jar.set(ACT_FOR_COOKIE, target, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' })
  else jar.delete(ACT_FOR_COOKIE)
  redirect('/account')
}

export async function deleteMyAccount() {
  const { user } = await getMemberContext()
  await createServiceClient().auth.admin.deleteUser(user.id)
  redirect('/')
}
