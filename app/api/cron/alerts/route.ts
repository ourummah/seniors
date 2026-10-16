import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server.ts'
import { cronAllowed } from '@/lib/cron.ts'
import { matches } from '@/lib/match.ts'
import { sendEmail, sendSms } from '@/lib/notify.ts'
import type { Answers, Benefit } from '@/lib/types.ts'

export const maxDuration = 300

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seniorsmoneyfinder.com'

// Daily: tell members about checked benefits that are new to them or whose figures changed
// since we last alerted them. Only verified records trigger alerts.
export async function GET(request: NextRequest) {
  if (!cronAllowed(request)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const db = createServiceClient()
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: recent } = await db.from('benefits').select('*').eq('status', 'published').eq('verified', true).gte('updated_at', since)
  if (!recent?.length) return NextResponse.json({ sent: 0 })

  const { data: members } = await db
    .from('member_answers')
    .select('member_id, state, postcode, age, cards, tags, profiles(email, phone, alert_email, alert_sms)')
  let sent = 0
  for (const m of members ?? []) {
    const answers = m as unknown as Answers
    const p = m.profiles as unknown as { email: string | null; phone: string | null; alert_email: boolean; alert_sms: boolean } | null
    const hits = (recent as Benefit[]).filter((b) => matches(b, answers))
    if (!p || !hits.length) continue
    const { data: already } = await db.from('alerts_sent').select('benefit_id').eq('member_id', m.member_id).gte('sent_at', since)
    const fresh = hits.filter((b) => !(already ?? []).some((a) => a.benefit_id === b.id))
    if (!fresh.length) continue
    const names = fresh.map((b) => `- ${b.name}: ${b.value_text}`).join('\n')
    const rows: { member_id: string; benefit_id: string; channel: 'email' | 'sms'; kind: 'changed_benefit' }[] = []
    if (p.alert_email && p.email && (await sendEmail(p.email, 'New or updated benefits for you', `Hello,\n\nThese benefits you may be eligible for are new or have changed:\n\n${names}\n\nSee the details and how to claim: ${SITE}/account\n\nSeniors Money Finder`))) {
      fresh.forEach((b) => rows.push({ member_id: m.member_id, benefit_id: b.id, channel: 'email', kind: 'changed_benefit' }))
    }
    if (p.alert_sms && p.phone && (await sendSms(p.phone, `Seniors Money Finder: ${fresh.length} benefit(s) for you are new or updated. Log in to see them: ${SITE}/account`))) {
      fresh.forEach((b) => rows.push({ member_id: m.member_id, benefit_id: b.id, channel: 'sms', kind: 'changed_benefit' }))
    }
    if (rows.length) {
      await db.from('alerts_sent').insert(rows)
      sent++
    }
  }
  return NextResponse.json({ sent })
}
