import Link from 'next/link'
import { requireUser } from '@/lib/auth.ts'
import { STATES } from '@/lib/types.ts'

export const metadata = { title: 'Benefits admin' }

export default async function AdminBenefits({ searchParams }: { searchParams: Promise<{ state?: string; show?: string }> }) {
  const { state = 'ALL', show = 'all' } = await searchParams
  const { supabase } = await requireUser(['admin'])
  let q = supabase.from('benefits').select('id, name, state, category, max_annual_value, value_period, verified, status, minutes_spent, source_changed_at').order('id')
  if (state !== 'ALL' || show !== 'all') q = q.eq('state', state)
  if (show === 'unchecked') q = q.eq('verified', false)
  if (show === 'changed') q = q.not('source_changed_at', 'is', null)
  const { data } = await q
  const rows = data ?? []
  const { count: total } = await supabase.from('benefits').select('id', { count: 'exact', head: true })
  const { count: checked } = await supabase.from('benefits').select('id', { count: 'exact', head: true }).eq('verified', true)
  const minutes = rows.reduce((s, r) => s + (r.minutes_spent ?? 0), 0)
  return (
    <>
      <h1>Benefits</h1>
      <p>{checked ?? 0} of {total ?? 0} checked. Checking time logged for this list: {Math.round(minutes / 6) / 10} hours.</p>
      <form className="row no-print" style={{ marginBottom: 16 }}>
        <select name="state" defaultValue={state} aria-label="State" style={{ width: 'auto' }}>
          <option value="ALL">Federal</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="show" defaultValue={show} aria-label="Show" style={{ width: 'auto' }}>
          <option value="all">Everything</option>
          <option value="unchecked">Not yet checked</option>
          <option value="changed">Source page changed</option>
        </select>
        <button className="btn btn-line btn-small">Filter</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Benefit</th><th>Category</th><th>Max $/yr</th><th>Year</th><th>Checked</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td><Link href={`/admin/benefits/${r.id}`}>{r.name}</Link>{r.status !== 'published' && <> <span className="pill warn">{r.status}</span></>}{r.source_changed_at && <> <span className="pill warn">source changed</span></>}</td>
                <td>{r.category}</td>
                <td>{r.max_annual_value ?? ''}</td>
                <td>{r.value_period}</td>
                <td>{r.verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
