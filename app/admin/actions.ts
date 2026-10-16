'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth.ts'
import { createServiceClient } from '@/lib/supabase/server.ts'

const EDITABLE = ['name', 'provider', 'category', 'summary', 'eligibility_text', 'value_text', 'max_annual_value', 'value_period', 'how_to_claim', 'phone', 'source_url', 'notes', 'status'] as const

export async function saveBenefit(fd: FormData) {
  const { supabase, user } = await requireUser(['admin'])
  const id = String(fd.get('id'))
  const { data: before } = await supabase.from('benefits').select('*').eq('id', id).single()
  if (!before) return
  const patch: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    const raw = String(fd.get(key) ?? '').trim()
    const value = key === 'max_annual_value' ? (raw === '' ? null : Number(raw)) : raw || (key === 'phone' || key === 'notes' || key === 'value_period' ? null : '')
    if (String(before[key] ?? '') !== String(value ?? '')) patch[key] = value
  }
  for (const key of ['cards', 'requires'] as const) {
    const list = String(fd.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    if (list.join(',') !== (before[key] as string[]).join(',')) patch[key] = list
  }
  const reason = String(fd.get('reason') ?? '').trim() || null
  const verify = fd.get('verified') === 'on'
  const minutes = Number(fd.get('minutes_spent'))
  if (verify && !before.verified) Object.assign(patch, { verified: true, verified_by: user.id, verified_at: new Date().toISOString() })
  if (!verify && before.verified) Object.assign(patch, { verified: false })
  if (Number.isFinite(minutes) && minutes > 0) patch.minutes_spent = (before.minutes_spent ?? 0) + Math.round(minutes)
  if (!Object.keys(patch).length) redirect(`/admin/benefits/${id}`)
  // Any change to a figure or rule means the record needs checking again.
  if (!('verified' in patch) && Object.keys(patch).some((k) => ['value_text', 'max_annual_value', 'cards', 'requires', 'eligibility_text'].includes(k))) {
    patch.verified = false
  }
  patch.updated_at = new Date().toISOString()
  await supabase.from('benefits').update(patch).eq('id', id)
  const logs = Object.keys(patch)
    .filter((k) => k !== 'updated_at' && k !== 'verified_by' && k !== 'verified_at')
    .map((field) => ({ benefit_id: id, changed_by: user.id, field, old_value: JSON.stringify(before[field] ?? null), new_value: JSON.stringify(patch[field] ?? null), reason }))
  if (logs.length) await supabase.from('change_log').insert(logs)
  revalidatePath('/admin')
  redirect(`/admin/benefits/${id}?saved=1`)
}

export async function reviewOffer(fd: FormData) {
  const { supabase } = await requireUser(['admin'])
  const status = fd.get('decision') === 'approve' ? 'approved' : 'rejected'
  await supabase.from('offers').update({ status, review_note: String(fd.get('note') ?? '').trim() || null }).eq('id', String(fd.get('id')))
  revalidatePath('/admin/offers')
}

export async function reviewBusiness(fd: FormData) {
  await requireUser(['admin'])
  const status = fd.get('decision') === 'approve' ? 'approved' : 'rejected'
  // Status is not writable by normal accounts, so this goes through the service role after the admin check above.
  await createServiceClient().from('businesses').update({ status }).eq('id', String(fd.get('id')))
  revalidatePath('/admin/businesses')
}
