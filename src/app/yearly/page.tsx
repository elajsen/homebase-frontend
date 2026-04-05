'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/ui/Nav'
import Card, { CardHeader } from '@/components/ui/Card'
import Sparkline from '@/components/ui/Sparkline'
import BarChart from '@/components/ui/BarChart'
import { apiFetch, YearlySummary, MonthEntry } from '@/lib/api'

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtPct(n: number | null): string {
  if (n == null) return '—'
  return `${n > 0 ? '↑' : n < 0 ? '↓' : ''} ${Math.abs(n)}%`.trim()
}

function profitPillStyle(profit: number | null): React.CSSProperties {
  if (profit == null) return { background: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
  if (profit > 2000)  return { background: 'rgba(16,185,129,0.15)',  color: 'var(--positive)', border: '1px solid rgba(16,185,129,0.25)' }
  if (profit > 0)     return { background: 'rgba(16,185,129,0.08)',  color: 'var(--positive)', border: '1px solid rgba(16,185,129,0.15)' }
  return               { background: 'var(--negative-dim)',           color: 'var(--negative)', border: '1px solid var(--negative-border)' }
}

export default function YearlyPage() {
  const currentYear = String(new Date().getFullYear())
  const [year, setYear]           = useState(currentYear)
  const [years, setYears]         = useState<string[]>([])
  const [summary, setSummary]     = useState<YearlySummary | null>(null)
  const [months, setMonths]       = useState<MonthEntry[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    apiFetch<string[]>('/v1/yearly/years').then(setYears).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<YearlySummary>(`/v1/yearly/summary?year=${year}`),
      apiFetch<MonthEntry[]>(`/v1/yearly/months?year=${year}`),
    ]).then(([s, m]) => {
      setSummary(s)
      setMonths(m)
      setLoading(false)
    }).catch(console.error)
  }, [year])

  const canGoNext = years.length > 0 && year !== years[0]
  const canGoPrev = years.length > 0 && year !== years[years.length - 1]

  return (
    <>
      <Nav />
      <main className="page">

        {/* ── Page header ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => {
                const idx = years.indexOf(year)
                if (idx < years.length - 1) setYear(years[idx + 1])
              }}
              style={{ ...navBtnStyle, opacity: canGoPrev ? 1 : 0.3, cursor: canGoPrev ? 'pointer' : 'default' }}
            >
              ←
            </button>
            <div>
              <div style={{
                fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}>
                {year}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Yearly snapshot · {summary ? `January – ${months.filter(m => m.status !== 'future').at(-1)?.label ?? '—'} (YTD)` : 'Loading…'}
              </div>
            </div>
            <button
              onClick={() => {
                const idx = years.indexOf(year)
                if (idx > 0) setYear(years[idx - 1])
              }}
              style={{ ...navBtnStyle, opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'default' }}
            >
              →
            </button>
          </div>
        </div>

        {/* ── YTD KPI cards ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              variant: 'green',
              label: 'Total Income YTD',
              value: summary ? fmt(summary.total_income_ytd) : '—',
              valueColor: 'var(--positive)',
              sub: summary ? `Avg ${fmt(summary.avg_monthly_income)} / month` : '—',
              yoy: summary?.yoy.income_pct,
              yoyDir: (summary?.yoy.income_pct ?? 0) >= 0 ? 'up' : 'down' as 'up'|'down',
              spark: summary?.sparklines.income ?? [],
              sparkColor: '#10B981',
            },
            {
              variant: 'red',
              label: 'Total Spending YTD',
              value: summary ? fmt(summary.total_spending_ytd) : '—',
              valueColor: 'var(--negative)',
              sub: summary ? `Avg ${fmt(summary.avg_monthly_spending)} / month` : '—',
              yoy: summary?.yoy.spending_pct,
              yoyDir: (summary?.yoy.spending_pct ?? 0) <= 0 ? 'up' : 'down' as 'up'|'down',
              spark: summary?.sparklines.spending ?? [],
              sparkColor: '#F87171',
            },
            {
              variant: 'blue',
              label: 'Net Profit YTD',
              value: summary ? fmt(summary.net_profit_ytd) : '—',
              valueColor: 'var(--blue)',
              sub: summary ? `Avg ${fmt(summary.net_profit_ytd / (summary.months_with_data || 1))} / month · Rate ${summary.savings_rate_ytd}%` : '—',
              yoy: summary?.yoy.net_pct,
              yoyDir: (summary?.yoy.net_pct ?? 0) >= 0 ? 'up' : 'down' as 'up'|'down',
              spark: summary?.sparklines.net ?? [],
              sparkColor: '#3B82F6',
            },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)',
              padding: '24px 26px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
                background: `linear-gradient(90deg, ${card.sparkColor}, transparent)`,
              }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 8,
                color: card.valueColor,
              }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <Sparkline data={card.spark} color={card.sparkColor} />
                {card.yoy != null && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: card.yoyDir === 'up' ? 'var(--positive-dim)' : 'var(--negative-dim)',
                    color: card.yoyDir === 'up' ? 'var(--positive)' : 'var(--negative)',
                    whiteSpace: 'nowrap',
                  }}>
                    {fmtPct(card.yoy)} YoY
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Monthly bar chart ─────────────────────── */}
        <Card style={{ marginBottom: 24 }}>
          <CardHeader
            title={`Monthly Overview — ${year}`}
            subtitle="Income and Spending by month · Future months shown as projected"
            right={
              <div style={{ display: 'flex', gap: 18 }}>
                {[
                  { color: 'var(--positive)',  label: 'Income' },
                  { color: 'rgba(248,113,113,0.75)', label: 'Spending' },
                  { color: 'var(--surface-3)', label: 'Projected' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            }
          />
          {months.length > 0 && <BarChart months={months} />}
          {months.length === 0 && loading && (
            <div style={{ height: 156, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>Loading…</span>
            </div>
          )}
        </Card>

        {/* ── Month-by-month table ──────────────────── */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
              fontSize: 15,
              fontWeight: 600,
            }}>
              Month-by-Month Breakdown
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Month', 'Income', 'Spending', 'Profit / Loss', 'Savings Rate'].map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 24px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    textAlign: i === 0 ? 'left' : 'right',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(m => {
                const isCurrent = m.status === 'current'
                const isFuture  = m.status === 'future'
                return (
                  <tr key={m.month} style={{ opacity: isFuture ? 0.45 : 1, borderBottom: '1px solid var(--border)' }}>
                    <td style={{
                      padding: '13px 24px',
                      fontSize: 14,
                      position: 'relative',
                    }}>
                      {/* Blue left border for current */}
                      {isCurrent && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--blue)' }} />
                      )}
                      {isCurrent && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.04)' }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isFuture ? 'var(--surface-3)' : isCurrent ? 'var(--blue)' : 'var(--positive)',
                        }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{m.label}</span>
                        {isCurrent && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 20,
                            background: 'var(--blue-dim)',
                            color: 'var(--blue)',
                          }}>
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: m.income != null ? 'var(--positive)' : 'var(--text-disabled)' }}>
                      {m.income != null ? fmt(m.income) : '—'}
                    </td>
                    <td style={{ padding: '13px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: m.spending != null ? 'var(--negative)' : 'var(--text-disabled)' }}>
                      {m.spending != null ? fmt(m.spending) : '—'}
                    </td>
                    <td style={{ padding: '13px 24px', textAlign: 'right' }}>
                      {m.profit != null ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontVariantNumeric: 'tabular-nums',
                          ...profitPillStyle(m.profit),
                        }}>
                          {m.profit >= 0 ? '↑' : '↓'} {m.profit >= 0 ? '+' : ''}{fmt(m.profit)}
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(148,163,184,0.08)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}>
                          No data
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: m.savings_rate != null ? (m.savings_rate >= 40 ? 'var(--positive)' : 'var(--text-muted)') : 'var(--text-disabled)' }}>
                      {m.savings_rate != null ? `${m.savings_rate}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* YTD footer */}
            {summary && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'var(--surface-2)' }}>
                  <td style={{ padding: '14px 24px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Year to Date
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--positive)' }}>
                    {fmt(summary.total_income_ytd)}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--negative)' }}>
                    {fmt(summary.total_spending_ytd)}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 14,
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontVariantNumeric: 'tabular-nums',
                      ...profitPillStyle(summary.net_profit_ytd),
                    }}>
                      ↑ +{fmt(summary.net_profit_ytd)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--positive)' }}>
                    {summary.savings_rate_ytd}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </main>
    </>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-2)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all var(--duration-fast)',
}
