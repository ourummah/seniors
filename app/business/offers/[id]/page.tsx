import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth.ts'
import type { Offer } from '@/lib/types.ts'
import { OfferForm } from '../../OfferForm.tsx'

export default async function EditOffer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser(['business', 'admin'])
  const { data } = await supabase.from('offers').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  return (
    <>
      <h1>Edit offer</h1>
      <OfferForm offer={data as Offer} />
    </>
  )
}
