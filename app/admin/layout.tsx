import { Shell, ADMIN_NAV } from '@/components/Shell.tsx'
import { requireUser } from '@/lib/auth.ts'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['admin'])
  return <Shell nav={ADMIN_NAV}>{children}</Shell>
}
