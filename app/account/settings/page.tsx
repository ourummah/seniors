import { getMemberContext } from '@/lib/member.ts'
import { saveAlertSettings, inviteHelper, removeHelper, actFor, deleteMyAccount } from '../actions.ts'

export const metadata = { title: 'Alerts and helpers' }

export default async function SettingsPage() {
  const { supabase, user, profile, memberId } = await getMemberContext()
  const { data: helpers } = await supabase.from('member_helpers').select('helper_email, helper_id').eq('member_id', user.id)
  const { data: helping } = await supabase.from('member_helpers').select('member_id, profiles!member_helpers_member_id_fkey(full_name, email, phone)').eq('helper_id', user.id)
  return (
    <>
      <h1>Alerts and helpers</h1>
      <form action={saveAlertSettings} className="card">
        <h2>Alerts</h2>
        <p className="help">We let you know when a new benefit matches you, a rebate needs renewing, or an amount changes.</p>
        <div className="field">
          <label htmlFor="full_name">Your name</label>
          <input id="full_name" name="full_name" type="text" defaultValue={profile?.full_name ?? ''} />
        </div>
        <label className="choice"><input type="checkbox" name="alert_email" defaultChecked={profile?.alert_email ?? true} /><span><strong>Email me</strong>{profile?.email ? ` at ${profile.email}` : ''}</span></label>
        <label className="choice"><input type="checkbox" name="alert_sms" defaultChecked={profile?.alert_sms ?? false} /><span><strong>Text me</strong>{profile?.phone ? ` on ${profile.phone}` : ' (log in with your mobile to add it)'}</span></label>
        <button className="btn btn-primary">Save</button>
      </form>

      <section className="card">
        <h2>Family helper</h2>
        <p className="help">A family member or carer can see and update your benefits. They log in with their own email.</p>
        {(helpers ?? []).map((h) => (
          <form action={removeHelper} className="row" key={h.helper_email} style={{ marginBottom: 8 }}>
            <input type="hidden" name="helper_email" value={h.helper_email} />
            <span>{h.helper_email} {h.helper_id ? '' : '(not joined yet)'}</span>
            <button className="btn btn-line btn-small">Remove</button>
          </form>
        ))}
        <form action={inviteHelper} className="row">
          <input name="helper_email" type="email" placeholder="helper@example.com" aria-label="Helper's email" style={{ flex: '1 1 240px' }} required />
          <button className="btn btn-primary">Add helper</button>
        </form>
      </section>

      {(helping ?? []).length > 0 && (
        <section className="card">
          <h2>People you help</h2>
          {(helping ?? []).map((h) => {
            const p = h.profiles as unknown as { full_name: string | null; email: string | null; phone: string | null } | null
            return (
              <form action={actFor} className="row" key={h.member_id} style={{ marginBottom: 8 }}>
                <input type="hidden" name="member_id" value={h.member_id} />
                <span>{p?.full_name || p?.email || p?.phone}</span>
                <button className="btn btn-line btn-small" disabled={memberId === h.member_id}>{memberId === h.member_id ? 'Viewing now' : 'View their benefits'}</button>
              </form>
            )
          })}
          {memberId !== user.id && (
            <form action={actFor}><input type="hidden" name="member_id" value="" /><button className="btn btn-gold btn-small">Back to my own benefits</button></form>
          )}
        </section>
      )}

      <section className="card">
        <h2>Your data</h2>
        <p className="help">You can download everything we hold about you, or delete your account.</p>
        <div className="row">
          <a className="btn btn-line" href="/account/settings/export">Download my data</a>
          <form action={deleteMyAccount}><button className="btn btn-line" style={{ color: 'var(--danger)' }}>Delete my account</button></form>
        </div>
      </section>
    </>
  )
}
