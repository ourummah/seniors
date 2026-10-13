import { redirect } from 'next/navigation'
import { createClient, supabaseConfigured } from './supabase/server.ts'

export type Role = 'member' | 'business' | 'admin'

// Loads the signed-in user and their profile, or sends them to the login page.
export async function requireUser(roles?: Role[]) {
  if (!supabaseConfigured()) redirect('/login')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const role = (profile?.role ?? 'member') as Role
  if (roles && !roles.includes(role)) redirect(role === 'business' ? '/business' : '/account')
  return { supabase, user, profile, role }
}
