import { redirect } from 'next/navigation'
import { getMemberContext, loadAnswers, loadBenefitsFor } from '@/lib/member.ts'
import { matchBenefits, estimatedYearlyTotal, formatAud } from '@/lib/match.ts'
import { CATEGORIES, CLAIM_STATUS_LABELS, type ClaimStatus } from '@/lib/types.ts'
import { PrintButton } from './PrintButton.tsx'

export const metadata = { title: 'My entitlements summary' }

export default async function PrintPage() {
  const { supabase, memberId } = await getMemberContext()
  const answers = await loadAnswers(supabase, memberId)
  if (!answers) redirect('/account/questions')
  const matched = matchBenefits(await loadBenefitsFor(supabase, answers.state), answers)
  const { data: rows } = await supabase.from('member_benefits').select('benefit_id, status').eq('member_id', memberId)
  const status = new Map((rows ?? []).map((r) => [r.benefit_id as string, r.status as ClaimStatus]))
  const list = matched.filter((b) => status.get(b.id) !== 'not_eligible')
  return (
    <>
      <div className="row no-print" style={{ marginBottom: 16 }}><PrintButton /></div>
      <h1>My Entitlements</h1>
      <p>Prepared {new Date().toLocaleDateString('en-AU')} by Seniors Money Finder. Estimated value of unclaimed benefits: <strong>{formatAud(estimatedYearlyTotal(list.filter((b) => (status.get(b.id) ?? 'not_claimed') === 'not_claimed')))}</strong> a year.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Benefit</th><th>Who provides it</th><th>Value</th><th>How to claim</th><th>Status</th></tr></thead>
          <tbody>
            {CATEGORIES.flatMap((c) => list.filter((b) => b.category === c)).map((b) => (
              <tr key={b.id}>
                <td><strong>{b.name}</strong></td>
                <td>{b.provider}{b.phone ? <><br />{b.phone}</> : null}</td>
                <td>{b.max_annual_value ? `Up to ${formatAud(Number(b.max_annual_value))}/yr` : b.value_text}</td>
                <td>{b.how_to_claim}</td>
                <td>{CLAIM_STATUS_LABELS[status.get(b.id) ?? 'not_claimed']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="help" style={{ marginTop: 16 }}>General information only. Please confirm eligibility with each provider.</p>
    </>
  )
}
