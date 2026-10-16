import { cookies } from 'next/headers'
import { requireUser } from './auth.ts'
import type { Answers, Benefit } from './types.ts'

export const ACT_FOR_COOKIE = 'smf_act_for'

// Works out whose profile is being viewed: the member themself, or a member who invited
// this person as a helper (chosen on the settings page and kept in a cookie).
export async function getMemberContext() {
  const ctx = await requireUser(['member', 'admin'])
  const { supabase, user } = ctx
  const actFor = (await cookies()).get(ACT_FOR_COOKIE)?.value
  let memberId = user.id
  let memberLabel: string | null = null
  if (actFor && actFor !== user.id) {
    const { data } = await supabase.from('member_helpers').select('member_id').eq('member_id', actFor).eq('helper_id', user.id).maybeSingle()
    if (data) {
      memberId = actFor
      const { data: p } = await supabase.from('profiles').select('full_name, email, phone').eq('id', actFor).maybeSingle()
      memberLabel = p?.full_name || p?.email || p?.phone || 'the person you help'
    }
  }
  return { ...ctx, memberId, memberLabel }
}

export async function loadAnswers(supabase: Awaited<ReturnType<typeof requireUser>>['supabase'], memberId: string): Promise<Answers | null> {
  const { data } = await supabase.from('member_answers').select('state, postcode, age, cards, tags').eq('member_id', memberId).maybeSingle()
  return (data as Answers) ?? null
}

export async function loadBenefitsFor(supabase: Awaited<ReturnType<typeof requireUser>>['supabase'], state: string): Promise<Benefit[]> {
  const { data } = await supabase.from('benefits').select('*').eq('status', 'published').in('state', ['ALL', state]).order('name')
  return (data as Benefit[]) ?? []
}
