import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMemberContext } from '@/lib/member.ts'
import { formatAud } from '@/lib/match.ts'
import { CLAIM_STATUS_LABELS, type Benefit, type ClaimStatus } from '@/lib/types.ts'
import { setClaimStatus } from '../../actions.ts'

export default async function BenefitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, memberId } = await getMemberContext()
  const { data } = await supabase.from('benefits').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const b = data as Benefit
  const { data: row } = await supabase.from('member_benefits').select('status').eq('member_id', memberId).eq('benefit_id', id).maybeSingle()
  const current = (row?.status ?? 'not_claimed') as ClaimStatus

  return (
    <>
      <p className="no-print"><Link href="/account">← All my benefits</Link></p>
      <h1>{b.name}</h1>
      <p className="help">{b.provider} · {b.category}</p>
      <div className="card">
        <h2>What you could get</h2>
        <p className="value">{b.max_annual_value ? `Up to ${formatAud(Number(b.max_annual_value))} a year. ` : ''}{b.value_text}</p>
        {b.value_period && <p className="help">Amount for {b.value_period}.{!b.verified && ' Being checked against the official source.'}</p>}
      </div>
      <div className="card">
        <h2>Who can get it</h2>
        <p>{b.eligibility_text}</p>
        <p className="help">You may be eligible. Please confirm with {b.provider}.</p>
      </div>
      <div className="card">
        <h2>How to claim</h2>
        <ol className="steps">
          {b.how_to_claim.split(/(?<=\.)\s+/).filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}
          {b.phone && <li>Phone <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a> if you need help.</li>}
          <li>Official information: <a href={b.source_url} target="_blank" rel="noopener noreferrer">{new URL(b.source_url).hostname}</a></li>
        </ol>
      </div>
      <form action={setClaimStatus} className="card no-print">
        <h2>Where are you up to?</h2>
        <input type="hidden" name="benefit_id" value={b.id} />
        {(Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[]).map((s) => (
          <label className="choice" key={s}>
            <input type="radio" name="status" value={s} defaultChecked={s === current} />
            <span><strong>{CLAIM_STATUS_LABELS[s]}</strong></span>
          </label>
        ))}
        <button className="btn btn-primary">Save</button>
      </form>
      {b.verified_at && <p className="help">Last checked {new Date(b.verified_at).toLocaleDateString('en-AU')}.</p>}
    </>
  )
}
