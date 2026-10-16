import Link from 'next/link'
import { requireUser } from '@/lib/auth.ts'
import type { Offer } from '@/lib/types.ts'
import { registerBusiness, deleteOffer } from './actions.ts'
import { OfferForm } from './OfferForm.tsx'

export const metadata = { title: 'Business offers' }

const STATUS: Record<string, string> = { pending: 'Waiting for review', approved: 'Live', rejected: 'Not approved' }

export default async function BusinessHome({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams
  const { supabase, user } = await requireUser(['business', 'admin'])
  const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).maybeSingle()

  if (!biz) {
    return (
      <>
        <h1>Register your business</h1>
        <p className="help">Tell us about your business. We confirm your ABN before you can list offers.</p>
        {error === 'abn' && <div className="error">That ABN does not look right. Please check the 11 digits.</div>}
        {error === 'save' && <div className="error">Something went wrong. Please try again.</div>}
        <form action={registerBusiness} className="card">
          <div className="field"><label htmlFor="name">Business name</label><input id="name" name="name" type="text" required /></div>
          <div className="field"><label htmlFor="abn">ABN</label><input id="abn" name="abn" type="text" inputMode="numeric" placeholder="51 824 753 556" required /></div>
          <div className="field"><label htmlFor="contact_name">Contact person</label><input id="contact_name" name="contact_name" type="text" required /></div>
          <div className="field"><label htmlFor="contact_email">Contact email</label><input id="contact_email" name="contact_email" type="email" defaultValue={user.email ?? ''} required /></div>
          <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" /></div>
          <div className="field"><label htmlFor="website">Website</label><input id="website" name="website" type="url" placeholder="https://" /></div>
          <button className="btn btn-primary">Register</button>
        </form>
      </>
    )
  }

  const { data: offers } = await supabase.from('offers').select('*').eq('business_id', biz.id).order('created_at', { ascending: false })
  return (
    <>
      <h1>{biz.name}</h1>
      {biz.status === 'pending' && <div className="notice">Thanks for registering. We are checking your ABN and will email you when you can list offers.</div>}
      {biz.status === 'rejected' && <div className="error">We could not approve this business. Please contact us.</div>}
      {saved && <div className="success">Your offer has been sent for review.</div>}
      {error === 'save' && <div className="error">Something went wrong. Please try again.</div>}
      {(offers as Offer[] | null)?.map((o) => (
        <article className="card" key={o.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>{o.title}</h2>
            <span className={o.status === 'approved' ? 'pill' : 'pill warn'}>{STATUS[o.status]}</span>
          </div>
          <p>{o.discount_text}</p>
          {o.review_note && <p className="help">Reviewer note: {o.review_note}</p>}
          <p className="help">{o.views} views · {o.clicks} clicks</p>
          <div className="row">
            <Link className="btn btn-line btn-small" href={`/business/offers/${o.id}`}>Edit</Link>
            <form action={deleteOffer}><input type="hidden" name="id" value={o.id} /><button className="btn btn-line btn-small">Delete</button></form>
          </div>
        </article>
      ))}
      {biz.status === 'approved' && (
        <>
          <h2>Add a new offer</h2>
          <OfferForm />
        </>
      )}
    </>
  )
}
