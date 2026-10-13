import { Shell, MEMBER_NAV } from '@/components/Shell.tsx'
import { getMemberContext } from '@/lib/member.ts'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { memberLabel } = await getMemberContext()
  return (
    <Shell nav={MEMBER_NAV}>
      {memberLabel && <div className="notice no-print">You are helping <strong>{memberLabel}</strong>. <a href="/account/settings">Switch back</a></div>}
      {children}
    </Shell>
  )
}
