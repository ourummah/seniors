import { Shell, BUSINESS_NAV } from '@/components/Shell.tsx'
import { requireUser } from '@/lib/auth.ts'

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['business', 'admin'])
  return <Shell nav={BUSINESS_NAV}>{children}</Shell>
}
