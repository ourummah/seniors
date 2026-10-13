import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server.ts'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  const [profile, answers, benefits, helpers, alerts] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('member_answers').select('*').eq('member_id', user.id).maybeSingle(),
    supabase.from('member_benefits').select('*').eq('member_id', user.id),
    supabase.from('member_helpers').select('*').eq('member_id', user.id),
    supabase.from('alerts_sent').select('*').eq('member_id', user.id),
  ])
  const body = JSON.stringify({ profile: profile.data, answers: answers.data, benefits: benefits.data, helpers: helpers.data, alerts: alerts.data }, null, 2)
  return new NextResponse(body, { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="my-seniors-money-finder-data.json"' } })
}
