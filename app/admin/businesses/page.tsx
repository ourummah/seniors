import { requireUser } from '@/lib/auth.ts'
import { reviewBusiness } from '../actions.ts'

export const metadata = { title: 'Businesses' }

export default async function AdminBusinesses() {
  const { supabase } = await requireUser(['admin'])
  const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false })
  return (
    <>
      <h1>Businesses</h1>
      <p className="help">Check each ABN on ABN Lookup before approving. Only approved businesses can add offers.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Business</th><th>ABN</th><th>Contact</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((b) => (
              <tr key={b.id}>
                <td>{b.name}{b.website && <><br /><a href={b.website} target="_blank" rel="noopener noreferrer">{b.website}</a></>}</td>
                <td><a href={`https://abr.business.gov.au/ABN/View?abn=${b.abn}`} target="_blank" rel="noopener noreferrer">{b.abn}</a></td>
                <td>{b.contact_name}<br />{b.contact_email}<br />{b.phone}</td>
                <td>{b.status}</td>
                <td>
                  {b.status !== 'approved' && (
                    <form action={reviewBusiness} className="row">
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn btn-primary btn-small" name="decision" value="approve">Approve</button>
                      {b.status === 'pending' && <button className="btn btn-line btn-small" name="decision" value="reject">Reject</button>}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
