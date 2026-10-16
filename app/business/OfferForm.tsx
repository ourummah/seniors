import { STATES, STATE_NAMES, type Offer } from '@/lib/types.ts'
import { saveOffer } from './actions.ts'

export function OfferForm({ offer }: { offer?: Offer }) {
  const states = new Set(offer?.states ?? STATES)
  return (
    <form action={saveOffer} className="card">
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <div className="field"><label htmlFor="title">Offer title</label><input id="title" name="title" type="text" maxLength={120} defaultValue={offer?.title} required /></div>
      <div className="field"><label htmlFor="discount_text">The deal, in a few words</label><input id="discount_text" name="discount_text" type="text" maxLength={120} placeholder="15% off all hearing aids" defaultValue={offer?.discount_text} required /></div>
      <div className="field"><label htmlFor="description">Description</label><textarea id="description" name="description" maxLength={1000} defaultValue={offer?.description} required /></div>
      <fieldset className="field" style={{ border: 0, padding: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: 6 }}>Where is it available?</legend>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {STATES.map((s) => (
            <label className="choice" key={s} style={{ marginBottom: 0 }}><input type="checkbox" name="states" value={s} defaultChecked={states.has(s)} /><span>{STATE_NAMES[s]}</span></label>
          ))}
        </div>
      </fieldset>
      <div className="field"><label htmlFor="postcodes">Only these postcodes (optional)</label><input id="postcodes" name="postcodes" type="text" placeholder="3000, 3001" defaultValue={offer?.postcodes ?? ''} /></div>
      <div className="row">
        <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="starts_on">Starts</label><input id="starts_on" name="starts_on" type="date" defaultValue={offer?.starts_on} /></div>
        <div className="field" style={{ flex: '1 1 200px' }}><label htmlFor="ends_on">Ends (optional)</label><input id="ends_on" name="ends_on" type="date" defaultValue={offer?.ends_on ?? ''} /></div>
      </div>
      <div className="field">
        <label htmlFor="redeem_method">How do members use it?</label>
        <select id="redeem_method" name="redeem_method" defaultValue={offer?.redeem_method ?? 'show_card'}>
          <option value="show_card">Show their Seniors Card or concession card</option>
          <option value="code">Enter a discount code</option>
          <option value="link">Follow a special link</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="field"><label htmlFor="redeem_details">Code, link or instructions</label><input id="redeem_details" name="redeem_details" type="text" defaultValue={offer?.redeem_details ?? ''} /></div>
      <div className="field"><label htmlFor="image_url">Logo or photo web address (optional, https)</label><input id="image_url" name="image_url" type="url" defaultValue={offer?.image_url ?? ''} /></div>
      <p className="help">Every new or changed offer is checked by our team before members see it.</p>
      <button className="btn btn-primary">{offer ? 'Save and send for review' : 'Send for review'}</button>
    </form>
  )
}
