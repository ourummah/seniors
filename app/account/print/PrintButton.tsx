'use client'
export function PrintButton() {
  return <button className="btn btn-gold" onClick={() => window.print()}>Print this page</button>
}
