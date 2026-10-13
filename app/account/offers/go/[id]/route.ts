import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server.ts'

// Counts the click, then sends the member on to the business's page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('offers').select('redeem_method, redeem_details, businesses(website)').eq('id', id).eq('status', 'approved').maybeSingle()
  const biz = data?.businesses as unknown as { website: string | null } | null
  const target = data?.redeem_method === 'link' ? data.redeem_details : biz?.website
  if (!target || !/^https?:\/\//.test(target)) return NextResponse.redirect(new URL('/account/offers', request.url))
  await supabase.rpc('count_offer', { offer: id, kind: 'click' })
  return NextResponse.redirect(target)
}
