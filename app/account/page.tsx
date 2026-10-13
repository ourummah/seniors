import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMemberContext, loadAnswers, loadBenefitsFor } from '@/lib/member.ts'
import { matchBenefits, estimatedYearlyTotal, formatAud } from '@/lib/match.ts'
import { CATEGORIES, CLAIM_STATUS_LABELS, STATE_NAMES, type ClaimStatus } from '@/lib/types.ts'

export const metadata = { title: 'My benefits' }

export default async function MyBenefits() {
  const { supabase, memberId } = await getMemberContext()
  const answers = await loadAnswers(supabase, memberId)
  if (!answers) redirect('/account/questions')

  const matched = matchBenefits(await loadBenefitsFor(supabase, answers.state), answers)
  const { data: statusRows } = await supabase.from('member_benefits').select('benefit_id, status').eq('member_id', memberId)
  const status = new Map((statusRows ?? []).map((r) => [r.benefit_id as string, r.status as ClaimStatus]))
  const shown = matched.filter((b) => status.get(b.id) !== 'not_eligible')
  const notClaimed = shown.filter((b) => (status.get(b.id) ?? 'not_claimed') === 'not_claimed')
  const total = estimatedYearlyTotal(notClaimed)

  return (
    <>
      <div className="headline">
        <span>You could be getting up to</span>
        <span className="big">{formatAud(total)} more a year</span>
        <span>from {notClaimed.length} benefits you have not claimed yet in {STATE_NAMES[answers.state]}.</span>
      </div>
      <div className="row no-print" style={{ marginBottom: 20 }}>
        <Link className="btn btn-gold" href="/account/print">Print my summary</Link>
        <Link className="btn btn-line" href="/account/questions">Change my answers</Link>
      </div>
      <p className="help">
        These are benefits you <strong>may</strong> be eligible for, based on your answers. Always confirm with the provider.
        Dollar amounts are the most you could get and are being checked against official sources.
      </p>
      {shown.length === 0 && <div className="card">We did not find any matches yet. Try <Link href="/account/questions">checking your answers</Link>.</div>}
      {CATEGORIES.map((cat) => {
        const list = shown.filter((b) => b.category === cat)
        if (!list.length) return null
        return (
          <section key={cat} aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`}>{cat} <span className="pill">{list.length}</span></h2>
            {list.map((b) => {
              const s = status.get(b.id) ?? 'not_claimed'
              return (
                <article className="card benefit" key={b.id}>
                  <h3><Link href={`/account/benefits/${b.id}`}>{b.name}</Link></h3>
                  <div className="meta">{b.provider}</div>
                  <p>{b.summary || b.value_text}</p>
                  <div className="row">
                    {b.max_annual_value ? <span className="value">Up to {formatAud(Number(b.max_annual_value))} a year</span> : <span className="value">{b.value_text}</span>}
                    <span className={s === 'not_claimed' ? 'pill warn' : 'pill'}>{CLAIM_STATUS_LABELS[s]}</span>
                    {!b.verified && <span className="pill warn" title="Amount not yet checked by our team">Amount being checked</span>}
                  </div>
                </article>
              )
            })}
          </section>
        )
      })}
    </>
  )
}
