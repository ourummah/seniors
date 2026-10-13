'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth.ts'
import { cleanAbn, isValidAbn } from '@/lib/abn.ts'
import { STATES } from '@/lib/types.ts'

function text(fd: FormData, key: string, max = 500): string {
  return String(fd.get(key) ?? '').trim().slice(0, max)
}

export async function registerBusiness(fd: FormData) {
  const { supabase, user } = await requireUser(['business', 'admin'])
  const abn = cleanAbn(text(fd, 'abn'))
  if (!isValidAbn(abn)) redirect('/business?error=abn')
  const website = text(fd, 'website')
  const { error } = await supabase.from('businesses').insert({
    owner_id: user.id,
    name: text(fd, 'name', 200),
    abn,
    contact_name: text(fd, 'contact_name', 200),
    contact_email: text(fd, 'contact_email', 200),
    phone: text(fd, 'phone', 40) || null,
    website: /^https?:\/\//.test(website) ? website : null,
  })
  if (error) redirect('/business?error=save')
  revalidatePath('/business')
  redirect('/business')
}

export async function saveOffer(fd: FormData) {
  const { supabase, user } = await requireUser(['business', 'admin'])
  const { data: biz } = await supabase.from('businesses').select('id, status').eq('owner_id', user.id).maybeSingle()
  if (!biz || biz.status !== 'approved') redirect('/business')
  const states = fd.getAll('states').map(String).filter((s) => (STATES as readonly string[]).includes(s))
  const method = text(fd, 'redeem_method')
  const offer = {
    business_id: biz.id,
    title: text(fd, 'title', 120),
    description: text(fd, 'description', 1000),
    discount_text: text(fd, 'discount_text', 120),
    states: states.length ? states : [...STATES],
    postcodes: text(fd, 'postcodes', 500) || null,
    starts_on: text(fd, 'starts_on') || new Date().toISOString().slice(0, 10),
    ends_on: text(fd, 'ends_on') || null,
    redeem_method: ['code', 'link', 'show_card', 'other'].includes(method) ? method : 'other',
    redeem_details: text(fd, 'redeem_details', 300) || null,
    image_url: /^https:\/\//.test(text(fd, 'image_url')) ? text(fd, 'image_url') : null,
  }
  const id = text(fd, 'id')
  const { error } = id
    ? await supabase.from('offers').update(offer).eq('id', id)
    : await supabase.from('offers').insert(offer)
  if (error) redirect('/business?error=save')
  revalidatePath('/business')
  redirect('/business?saved=1')
}

export async function deleteOffer(fd: FormData) {
  const { supabase } = await requireUser(['business', 'admin'])
  await supabase.from('offers').delete().eq('id', text(fd, 'id'))
  revalidatePath('/business')
}
