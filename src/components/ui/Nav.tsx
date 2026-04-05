'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',        label: 'Home' },
  { href: '/monthly', label: 'Monthly' },
  { href: '/yearly',  label: 'Yearly' },
]

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(19,29,46,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
    }}>
      {/* Brand */}
      <span style={{
        fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
        fontSize: 17,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #93C5FD, #3B82F6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Clarity
      </span>

      {/* Links */}
      <div style={{ display: 'flex', gap: 2 }}>
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: active ? 'var(--blue)' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '6px 16px',
                borderRadius: 'var(--r-sm)',
                background: active ? 'var(--blue-dim)' : 'transparent',
                transition: 'all var(--duration-fast)',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
          {todayLabel()}
        </span>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
        }}>
          EM
        </div>
      </div>
    </nav>
  )
}
