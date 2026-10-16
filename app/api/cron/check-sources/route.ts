import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server.ts'
import { cronAllowed } from '@/lib/cron.ts'

export const maxDuration = 300

// Strips scripts, tags and whitespace so only the readable text is compared.
function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Nightly: fetch each official source page and flag the benefit when its text changes,
// so an admin re-checks it. The first run only records a fingerprint.
export async function GET(request: NextRequest) {
  if (!cronAllowed(request)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const db = createServiceClient()
  const { data: benefits } = await db.from('benefits').select('id, source_url, source_hash').eq('status', 'published')
  const byUrl = new Map<string, { id: string; source_hash: string | null }[]>()
  for (const b of benefits ?? []) byUrl.set(b.source_url, [...(byUrl.get(b.source_url) ?? []), b])

  let changed = 0
  let failed = 0
  for (const [url, rows] of byUrl) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'SeniorsMoneyFinderBot/1.0 (+https://seniorsmoneyfinder.com)' }, signal: AbortSignal.timeout(20000) })
      if (!res.ok) { failed++; continue }
      const body = await res.text()
      const hash = createHash('sha256').update(res.headers.get('content-type')?.includes('html') ? pageText(body) : body).digest('hex')
      const now = new Date().toISOString()
      for (const r of rows) {
        const update: Record<string, unknown> = { source_hash: hash, source_checked_at: now }
        if (r.source_hash && r.source_hash !== hash) {
          update.source_changed_at = now
          changed++
        }
        await db.from('benefits').update(update).eq('id', r.id)
      }
    } catch {
      failed++
    }
  }
  return NextResponse.json({ pages: byUrl.size, changed, failed })
}
