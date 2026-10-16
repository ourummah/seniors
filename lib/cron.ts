import type { NextRequest } from 'next/server'

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
export function cronAllowed(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}
