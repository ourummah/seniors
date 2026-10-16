import Link from 'next/link'

type NavItem = { href: string; label: string }

export function Shell({ nav, children }: { nav: NavItem[]; children: React.ReactNode }) {
  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link className="logo" href="/">Seniors Money Finder</Link>
          <nav className="topnav" aria-label="Account">
            {nav.map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
            <form action="/auth/signout" method="post">
              <button className="btn btn-line btn-small" type="submit">Log out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="foot">
        <div className="wrap">
          Seniors Money Finder gives general information only, not financial advice. Always confirm your eligibility with the provider of each benefit.
        </div>
      </footer>
    </>
  )
}

export const MEMBER_NAV: NavItem[] = [
  { href: '/account', label: 'My benefits' },
  { href: '/account/questions', label: 'My answers' },
  { href: '/account/offers', label: 'Offers' },
  { href: '/account/settings', label: 'Alerts and helpers' },
]
export const BUSINESS_NAV: NavItem[] = [{ href: '/business', label: 'My offers' }]
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Benefits' },
  { href: '/admin/offers', label: 'Offers to approve' },
  { href: '/admin/businesses', label: 'Businesses' },
]
