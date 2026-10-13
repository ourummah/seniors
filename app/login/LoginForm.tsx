'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client.ts'

// Turns 0412 345 678 into +61412345678, which Supabase needs for text messages.
function toE164(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return '+61' + digits.slice(1)
  if (digits.startsWith('61')) return '+' + digits
  return digits
}

export function LoginForm({ accountType }: { accountType: 'member' | 'business' }) {
  const router = useRouter()
  const [method, setMethod] = useState<'email' | 'sms'>('email')
  const [address, setAddress] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const supabase = createClient()
    const options = { shouldCreateUser: true, data: { account_type: accountType } }
    const { error } =
      method === 'email'
        ? await supabase.auth.signInWithOtp({ email: address.trim(), options })
        : await supabase.auth.signInWithOtp({ phone: toE164(address), options })
    setBusy(false)
    if (error) setError('We could not send a code. Please check and try again.')
    else setSent(true)
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const supabase = createClient()
    const token = code.replace(/\s/g, '')
    const { error } =
      method === 'email'
        ? await supabase.auth.verifyOtp({ email: address.trim(), token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: toE164(address), token, type: 'sms' })
    if (error) {
      setBusy(false)
      setError('That code did not work. Codes expire after one hour; you can ask for a new one.')
      return
    }
    router.replace(accountType === 'business' ? '/business' : '/account')
    router.refresh()
  }

  if (sent) {
    return (
      <form className="card" onSubmit={verify}>
        <p>We sent a code to <strong>{address}</strong>.</p>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="code">Enter your 6-digit code</label>
          <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div className="row">
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Log in'}</button>
          <button className="btn btn-line" type="button" onClick={() => { setSent(false); setCode('') }}>Use a different {method === 'email' ? 'email' : 'number'}</button>
        </div>
      </form>
    )
  }

  return (
    <form className="card" onSubmit={sendCode}>
      {error && <div className="error" role="alert">{error}</div>}
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
        <legend style={{ fontWeight: 700, marginBottom: 8 }}>How should we send your code?</legend>
        <label className="choice"><input type="radio" name="method" checked={method === 'email'} onChange={() => setMethod('email')} /><span><strong>Email</strong></span></label>
        <label className="choice"><input type="radio" name="method" checked={method === 'sms'} onChange={() => setMethod('sms')} /><span><strong>Text message</strong> to a mobile</span></label>
      </fieldset>
      <div className="field">
        <label htmlFor="address">{method === 'email' ? 'Your email address' : 'Your mobile number'}</label>
        <input
          id="address"
          type={method === 'email' ? 'email' : 'tel'}
          autoComplete={method === 'email' ? 'email' : 'tel'}
          placeholder={method === 'email' ? 'name@example.com' : '0412 345 678'}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send my code'}</button>
      <p className="help" style={{ marginTop: 14 }}>We will never ask for your myGov password or bank details.</p>
    </form>
  )
}
