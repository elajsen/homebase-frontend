'use client'

import { useEffect, useState, useCallback } from 'react'
import Nav from '@/components/ui/Nav'
import KpiCard from '@/components/ui/KpiCard'
import Card, { CardHeader } from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import LineChart from '@/components/ui/LineChart'
import {
  apiFetch,
  HomeSummary,
  ChartResponse,
  BudgetCategory,
  SavingsGoal,
  RecentTransaction,
  BillsResponse,
} from '@/lib/api'

type Period = 'week' | 'month' | 'year'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function greetingTime() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function fmt(n: number) {
  return '€' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtPct(n: number) {
  return `${n > 0 ? '↑' : n < 0 ? '↓' : ''} ${Math.abs(n)}%`.trim()
}

function fmtDelta(n: number) {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`
}

export default function HomePage() {
  const date = currentMonth()

  const [summary, setSummary]           = useState<HomeSummary | null>(null)
  const [chart, setChart]               = useState<ChartResponse | null>(null)
  const [categories, setCategories]     = useState<BudgetCategory[]>([])
  const [savingsGoal, setSavingsGoal]   = useState<SavingsGoal | null>(null)
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [bills, setBills]               = useState<BillsResponse | null>(null)
  const [period, setPeriod]             = useState<Period>('month')
  const [loading, setLoading]           = useState(true)
  const [expectedIncome, setExpectedIncome] = useState('')
  const [includeBills, setIncludeBills]     = useState(false)

  // Sync localStorage values set in the monthly page
  useEffect(() => {
    const storedExpected = localStorage.getItem('clarity_expected_income')
    if (storedExpected) setExpectedIncome(storedExpected)
    const storedBills = localStorage.getItem('clarity_include_bills')
    if (storedBills) setIncludeBills(storedBills === 'true')
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clarity_expected_income') setExpectedIncome(e.newValue ?? '')
      if (e.key === 'clarity_include_bills') setIncludeBills(e.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    Promise.all([
      apiFetch<HomeSummary>(`/v1/home/summary?date=${date}`),
      apiFetch<BudgetCategory[]>(`/v1/home/budget_categories?date=${date}`),
      apiFetch<SavingsGoal>(`/v1/home/savings_goal?date=${date}`),
      apiFetch<RecentTransaction[]>(`/v1/home/recent_transactions?date=${date}&limit=10`),
      apiFetch<BillsResponse>(`/v1/monthly/bills?date=${date}`),
    ]).then(([s, cats, sg, txs, b]) => {
      setSummary(s)
      setCategories(cats)
      setSavingsGoal(sg)
      setTransactions(txs)
      setBills(b)
      setLoading(false)
    }).catch(console.error)
  }, [date])

  const fetchChart = useCallback((p: Period) => {
    apiFetch<ChartResponse>(`/v1/home/chart?date=${date}&period=${p}`)
      .then(setChart)
      .catch(console.error)
  }, [date])

  useEffect(() => { fetchChart(period) }, [period, fetchChart])

  const handleHideTx = async (tx: RecentTransaction) => {
    try {
      await apiFetch(`/v1/transactions/set_visibility/${tx.transaction_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: false }),
      })
      setTransactions(prev => prev.filter(t => t.transaction_id !== tx.transaction_id))
    } catch (e) {
      console.error(e)
    }
  }

  const expectedVal = parseFloat(expectedIncome) || 0
  const billsAdj = includeBills ? (bills?.total_upcoming ?? 0) : 0
  const displayIncome = (summary?.income ?? 0) + expectedVal
  const displaySpending = (summary?.spending ?? 0) + billsAdj

  const vp = summary?.vs_previous_month

  return (
    <>
      <Nav />
      <main className="page">

        {/* ── Greeting ──────────────────────────────────── */}
        <div style={{
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: 3,
            }}>
              {greetingTime()}, Elias
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {loading
                ? 'Loading…'
                : `Here's your financial overview for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--positive)',
            background: 'var(--positive-dim)',
            border: '1px solid rgba(16,185,129,0.2)',
            padding: '6px 14px',
            borderRadius: 20,
          }}>
            ● Month in progress
          </div>
        </div>

        {/* ── KPI grid ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          <KpiCard
            label="Total Income"
            value={summary ? fmt(displayIncome) : '—'}
            valueColor="var(--positive)"
            variant="green"
            delta={vp ? `↑ ${Math.abs(vp.income_pct)}% vs ${vp.label}` : undefined}
            deltaDir={vp && vp.income_pct >= 0 ? 'up' : 'down'}
          />
          <KpiCard
            label="Total Spending"
            value={summary ? fmt(displaySpending) : '—'}
            valueColor="var(--negative)"
            variant="red"
            delta={vp ? `↑ ${Math.abs(vp.spending_pct)}% vs ${vp.label}` : undefined}
            deltaDir={vp && vp.spending_pct <= 0 ? 'up' : 'down'}
          />
          <KpiCard
            label="Remaining"
            value={summary ? fmt(summary.remaining) : '—'}
            valueColor="var(--blue)"
            variant="blue"
            delta="On track"
            deltaDir="up"
          />
          <KpiCard
            label="Savings Rate"
            value={summary ? `${summary.savings_rate}%` : '—'}
            valueColor="var(--text-primary)"
            variant="amber"
            delta={vp ? `↑ ${Math.abs(vp.net_pct)}% vs ${vp.label}` : undefined}
            deltaDir={vp && vp.net_pct >= 0 ? 'up' : 'down'}
          />
        </div>

        {/* ── Main grid ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 22 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Chart card */}
            <Card>
              <CardHeader
                title="Income vs Spending"
                subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                right={
                  <div style={{
                    display: 'inline-flex',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: 3,
                    gap: 2,
                  }}>
                    {(['week', 'month', 'year'] as Period[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        style={{
                          fontFamily: 'var(--font-source-sans, sans-serif)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                          padding: '5px 13px',
                          borderRadius: 'var(--r-sm)',
                          border: period === p ? '1px solid var(--border-strong)' : '1px solid transparent',
                          background: period === p ? 'var(--surface-1)' : 'transparent',
                          cursor: 'pointer',
                          boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        {p[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                }
              />
              {/* Legend */}
              <div style={{ display: 'flex', gap: 18, marginBottom: 10 }}>
                {[
                  { color: 'var(--positive)', label: 'Income' },
                  { color: 'var(--negative)', label: 'Spending' },
                  { color: 'var(--blue)',     label: 'Net' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ width: 18, height: 2, borderRadius: 1, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
              <LineChart buckets={chart?.buckets ?? []} />
            </Card>

            {/* Budget categories */}
            <Card>
              <CardHeader
                title="Budget Categories"
                subtitle="Month spending vs budget"
                right={
                  <a href="/monthly" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
                    View all →
                  </a>
                }
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {categories.length === 0 && !loading && (
                  <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No categories configured</span>
                )}
                {categories.map(cat => (
                  <ProgressBar
                    key={cat.id}
                    name={cat.name}
                    spent={cat.spent}
                    budget={cat.budget}
                    pct={cat.pct}
                    status={cat.status}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Savings goal card */}
            <div style={{
              background: 'linear-gradient(135deg, #1a2e4a 0%, #1E3A5F 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 'var(--r-xl)',
              padding: 22,
              boxShadow: '0 0 20px rgba(59,130,246,0.08)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                Monthly Savings Goal
              </div>
              <div style={{
                fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                fontSize: 28,
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.02em',
                marginBottom: 14,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {savingsGoal ? fmt(savingsGoal.goal) : '—'}
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 3, marginBottom: 8 }}>
                <div style={{
                  height: 6,
                  borderRadius: 3,
                  background: '#fff',
                  width: `${savingsGoal ? Math.min(savingsGoal.pct, 100) : 0}%`,
                  transition: 'width 0.4s var(--ease-out)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  {savingsGoal ? fmt(savingsGoal.saved) : '—'} saved
                </span>
                <span style={{
                  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  {savingsGoal ? `${savingsGoal.pct}%` : '—'}
                </span>
              </div>
              {savingsGoal && (
                <div style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Remaining to goal</span>
                  <span style={{
                    fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(savingsGoal.remaining)}
                  </span>
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  Recent Transactions
                </div>
                <a href="/monthly" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>
                  See all
                </a>
              </div>
              <div>
                {transactions.length === 0 && !loading && (
                  <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>No transactions</span>
                )}
                {transactions.map((tx, i) => (
                  <div
                    key={tx.transaction_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: tx.amount > 0 ? 'var(--positive-dim)' : 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      flexShrink: 0,
                    }}>
                      {tx.amount > 0 ? '💼' : '💳'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {tx.category} · {tx.value_date}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                      fontSize: 14,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: tx.amount > 0 ? 'var(--positive)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}>
                      {tx.amount > 0 ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                    </div>
                    <button
                      onClick={() => handleHideTx(tx)}
                      title="Hide transaction"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-disabled)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: 12,
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── vs Last Month ──────────────────────────────── */}
        {vp && summary && (
          <>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: 12,
              marginTop: 6,
            }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} vs {vp.label} {new Date().getFullYear()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                {
                  icon: '📈',
                  iconBg: 'var(--positive-dim)',
                  label: 'Income change',
                  value: fmtDelta(vp.income_delta),
                  valueColor: vp.income_delta >= 0 ? 'var(--positive)' : 'var(--negative)',
                  sub: `was ${fmt(summary.income - vp.income_delta)} in ${vp.label}`,
                  badge: fmtPct(vp.income_pct),
                  badgeColor: vp.income_pct >= 0 ? 'var(--positive)' : 'var(--negative)',
                  badgeBg: vp.income_pct >= 0 ? 'var(--positive-dim)' : 'var(--negative-dim)',
                },
                {
                  icon: '📉',
                  iconBg: 'var(--negative-dim)',
                  label: 'Spending change',
                  value: fmtDelta(vp.spending_delta),
                  valueColor: vp.spending_delta <= 0 ? 'var(--positive)' : 'var(--negative)',
                  sub: `was ${fmt(summary.spending - vp.spending_delta)} in ${vp.label}`,
                  badge: fmtPct(vp.spending_pct),
                  badgeColor: vp.spending_pct <= 0 ? 'var(--positive)' : 'var(--negative)',
                  badgeBg: vp.spending_pct <= 0 ? 'var(--positive-dim)' : 'var(--negative-dim)',
                },
                {
                  icon: '🎯',
                  iconBg: 'var(--blue-dim)',
                  label: 'Net savings change',
                  value: fmtDelta(vp.net_delta),
                  valueColor: vp.net_delta >= 0 ? 'var(--blue)' : 'var(--negative)',
                  sub: `was ${fmt(summary.remaining - vp.net_delta)} in ${vp.label}`,
                  badge: fmtPct(vp.net_pct),
                  badgeColor: vp.net_pct >= 0 ? 'var(--positive)' : 'var(--negative)',
                  badgeBg: vp.net_pct >= 0 ? 'var(--positive-dim)' : 'var(--negative-dim)',
                },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--r-md)',
                    background: item.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{
                      fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                      color: item.valueColor,
                    }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {item.sub}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 20,
                        background: item.badgeBg,
                        color: item.badgeColor,
                      }}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
