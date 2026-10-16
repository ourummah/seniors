import { redirect } from 'next/navigation'
import { getMemberContext, loadAnswers } from '@/lib/member.ts'
import type { Offer } from '@/lib/types.ts'

export const metadata = { title: 'Offers' }

export default async function OffersPage() {
  const { supabase, memberId } = await getMemberContext()
  const answers = await loadAnswers(supabase, memberId)
  if (!answers) redirect('/account/questions')
  const { data } = await supabase
    .from('offers')
    .select('*, businesses(name, website)')
    .eq('status', 'approved')
    .contains('states', [answers.state])
    .order('created_at', { ascending: false })
  const offers = ((data ?? []) as Offer[]).filter(
    (o) => !o.postcodes || !answers.postcode || o.postcodes.split(/[\s,]+/).includes(answers.postcode),
  )
  await Promise.all(offers.map((o) => supabase.rpc('count_offer', { offer: o.id, kind: 'view' })))
  return (
    <>
      <h1>Offers from businesses</h1>
      <p className="help">These are offers from businesses, not government benefits. We check each one before it appears here.</p>
      {offers.length === 0 && <div className="card">No offers in your area yet. Check back soon.</div>}
      {offers.map((o) => (
        <article className="card" key={o.id}>
          {o.image_url && <img src={o.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} />}
          <span className="pill warn">Offer from {o.businesses?.name}</span>
          <h2 style={{ marginTop: 8 }}>{o.title}</h2>
          <p className="value">{o.discount_text}</p>
          <p>{o.description}</p>
          <p className="help">
            {o.redeem_method === 'code' && `Use code: ${o.redeem_details}`}
            {o.redeem_method === 'show_card' && 'Show your Seniors Card or concession card.'}
            {o.redeem_method === 'other' && o.redeem_details}
            {o.ends_on && ` Ends ${new Date(o.ends_on).toLocaleDateString('en-AU')}.`}
          </p>
          {(o.redeem_method === 'link' || o.businesses?.website) && (
            <a className="btn btn-line btn-small" href={`/account/offers/go/${o.id}`} rel="noopener">Go to offer</a>
          )}
        </article>
      ))}
    </>
  )
}
