import { requireUser } from '@/lib/auth.ts'
import type { Offer } from '@/lib/types.ts'
import { reviewOffer } from '../actions.ts'

export const metadata = { title: 'Offers to approve' }

export default async function AdminOffers() {
  const { supabase } = await requireUser(['admin'])
  const { data } = await supabase.from('offers').select('*, businesses(name, website)').order('created_at', { ascending: false })
  const offers = (data ?? []) as Offer[]
  const pending = offers.filter((o) => o.status === 'pending')
  return (
    <>
      <h1>Offers to approve ({pending.length})</h1>
      {pending.length === 0 && <p>Nothing waiting.</p>}
      {pending.map((o) => (
        <article className="card" key={o.id}>
          <span className="pill">{o.businesses?.name}</span>
          <h2 style={{ marginTop: 8 }}>{o.title}</h2>
          <p><strong>{o.discount_text}</strong></p>
          <p>{o.description}</p>
          <p className="help">States: {o.states.join(', ')} {o.postcodes && `· Postcodes: ${o.postcodes}`} · {o.starts_on} to {o.ends_on ?? 'no end date'} · Redeem: {o.redeem_method} {o.redeem_details}</p>
          <form action={reviewOffer} className="row">
            <input type="hidden" name="id" value={o.id} />
            <input type="text" name="note" placeholder="Note to the business (optional)" style={{ flex: '1 1 240px' }} />
            <button className="btn btn-primary btn-small" name="decision" value="approve">Approve</button>
            <button className="btn btn-line btn-small" name="decision" value="reject">Reject</button>
          </form>
        </article>
      ))}
      <h2>All offers</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Business</th><th>Offer</th><th>Status</th><th>Views</th><th>Clicks</th></tr></thead>
          <tbody>{offers.map((o) => <tr key={o.id}><td>{o.businesses?.name}</td><td>{o.title}</td><td>{o.status}</td><td>{o.views}</td><td>{o.clicks}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}
