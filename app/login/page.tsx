import { LoginForm } from './LoginForm.tsx'
import { supabaseConfigured } from '@/lib/supabase/server.ts'

export const metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams
  const business = as === 'business'
  return (
    <main className="wrap" style={{ maxWidth: 560 }}>
      <p><a href="/">← Back to Seniors Money Finder</a></p>
      <h1>{business ? 'Business log in' : 'Log in or join'}</h1>
      <p className="help">
        {business
          ? 'List seniors offers for our members. We check every business and offer before it goes live.'
          : 'No password needed. We send you a 6-digit code by email or text message.'}
      </p>
      {supabaseConfigured() ? (
        <LoginForm accountType={business ? 'business' : 'member'} />
      ) : (
        <div className="notice">Log in is not switched on yet. The site owner needs to connect the database.</div>
      )}
    </main>
  )
}
