import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth.ts'
import { CATEGORIES } from '@/lib/types.ts'
import { saveBenefit } from '../../actions.ts'

export default async function EditBenefit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  const { supabase } = await requireUser(['admin'])
  const { data: b } = await supabase.from('benefits').select('*').eq('id', id).maybeSingle()
  if (!b) notFound()
  const { data: log } = await supabase.from('change_log').select('*').eq('benefit_id', id).order('created_at', { ascending: false }).limit(20)
  const field = (name: string, label: string, value: unknown, long = false) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {long ? <textarea id={name} name={name} defaultValue={String(value ?? '')} /> : <input id={name} name={name} type="text" defaultValue={String(value ?? '')} />}
    </div>
  )
  return (
    <>
      <p><Link href="/admin">← All benefits</Link></p>
      <h1>{b.id}: {b.name}</h1>
      {saved && <div className="success">Saved.</div>}
      {b.source_changed_at && <div className="notice">The official page changed on {new Date(b.source_changed_at).toLocaleDateString('en-AU')}. Please re-check this record, then tick “checked”.</div>}
      <p><a href={b.source_url} target="_blank" rel="noopener noreferrer">Open the official source ↗</a></p>
      <form action={saveBenefit} className="card">
        <input type="hidden" name="id" value={b.id} />
        {field('name', 'Name', b.name)}
        {field('provider', 'Provider', b.provider)}
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={b.category}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        {field('summary', 'Summary for members', b.summary, true)}
        {field('eligibility_text', 'Who can get it', b.eligibility_text, true)}
        {field('cards', 'Cards (comma separated: PCC, HCC, CSHC, DVA_GOLD, DVA_WHITE, SENIORS_CARD, NONE)', (b.cards as string[]).join(', '))}
        {field('requires', 'Extra requirements (comma separated tags)', (b.requires as string[]).join(', '))}
        {field('value_text', 'Value as stated by the source', b.value_text)}
        {field('max_annual_value', 'Most per year in dollars (blank if it depends)', b.max_annual_value)}
        {field('value_period', 'Year the amount applies to', b.value_period)}
        {field('how_to_claim', 'How to claim', b.how_to_claim, true)}
        {field('phone', 'Phone', b.phone)}
        {field('source_url', 'Official source URL', b.source_url)}
        {field('notes', 'Internal notes', b.notes, true)}
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={b.status}><option value="published">Published</option><option value="draft">Draft (hidden)</option><option value="retired">Retired (hidden)</option></select>
        </div>
        <div className="card" style={{ background: 'var(--brand-soft)' }}>
          <label className="choice"><input type="checkbox" name="verified" defaultChecked={b.verified} /><span><strong>Checked against the official source</strong>{b.verified_at && <span className="help"> Last checked {new Date(b.verified_at).toLocaleDateString('en-AU')}</span>}</span></label>
          <div className="field"><label htmlFor="minutes_spent">Minutes spent checking this time</label><input id="minutes_spent" name="minutes_spent" type="number" min={0} max={600} /></div>
          <p className="help">Total logged so far: {b.minutes_spent ?? 0} minutes.</p>
        </div>
        {field('reason', 'Reason for change (optional)', '')}
        <button className="btn btn-primary">Save</button>
      </form>
      <h2>Change history</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Field</th><th>Old</th><th>New</th><th>Reason</th></tr></thead>
          <tbody>
            {(log ?? []).map((l) => (
              <tr key={l.id}><td>{new Date(l.created_at).toLocaleString('en-AU')}</td><td>{l.field}</td><td>{l.old_value}</td><td>{l.new_value}</td><td>{l.reason}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
