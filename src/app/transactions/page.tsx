'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/ui/Nav'
import { apiFetch, Transaction, WeekEntry } from '@/lib/api'

// ── Helpers ────────────────────────────────────────────────────────────────────

function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + '-01'
}

function monthEnd(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Category badge ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  income:        { bg: 'var(--positive-dim)',               color: 'var(--positive)', label: 'Income' },
  housing:       { bg: 'var(--blue-dim)',                   color: 'var(--blue)',     label: 'Housing' },
  groceries:     { bg: 'rgba(16,185,129,0.08)',             color: '#34D399',         label: 'Groceries' },
  dining:        { bg: 'rgba(251,146,60,0.12)',             color: '#FB923C',         label: 'Dining' },
  transport:     { bg: 'rgba(148,163,184,0.1)',             color: 'var(--text-muted)', label: 'Transport' },
  shopping:      { bg: 'rgba(167,139,250,0.12)',            color: '#A78BFA',         label: 'Shopping' },
  health:        { bg: 'rgba(251,113,133,0.1)',             color: '#FB7185',         label: 'Health' },
  subscriptions: { bg: 'rgba(245,158,11,0.1)',              color: 'var(--warning)',  label: 'Subscriptions' },
}

function categoryStyle(raw: string) {
  const key = raw.toLowerCase().replace(/\s+/g, '_')
  for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
    if (key.includes(k)) return v
  }
  return { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)', label: raw }
}

// ── Main component (needs Suspense for useSearchParams) ────────────────────────

function TransactionsInner() {
  const router = useRouter()
  const params = useSearchParams()
  const today = new Date()
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const date = params.get('date') ?? defaultDate

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [weeks, setWeeks] = useState<WeekEntry[]>([])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setHidden(new Set())
    const from = monthStart(date)
    const to = monthEnd(date)
    Promise.all([
      apiFetch<Transaction[]>(`/v1/transactions/?date_from=${from}&date_to=${to}`),
      apiFetch<WeekEntry[]>(`/v1/monthly/weeks?date=${date}`),
    ]).then(([txs, wks]) => {
      setTransactions(txs)
      // pre-populate hidden set from is_visible flag
      setHidden(new Set(txs.filter(t => !t.is_visible).map(t => t.transaction_id)))
      setWeeks(wks)
    }).catch(console.error).finally(() => setLoading(false))
  }, [date])

  const toggleVisibility = async (tx: Transaction) => {
    const nowHidden = !hidden.has(tx.transaction_id)
    setHidden(prev => {
      const next = new Set(prev)
      if (nowHidden) next.add(tx.transaction_id); else next.delete(tx.transaction_id)
      return next
    })
    try {
      await apiFetch(`/v1/transactions/set_visibility/?transaction_id=${tx.transaction_id}&is_visible=${!nowHidden}`, { method: 'POST' })
    } catch (e) {
      // revert on error
      setHidden(prev => {
        const next = new Set(prev)
        if (nowHidden) next.delete(tx.transaction_id); else next.add(tx.transaction_id)
        return next
      })
      console.error(e)
    }
  }

  // Derive unique categories from data
  const categories = useMemo(() => {
    const seen = new Set<string>()
    transactions.forEach(t => seen.add(t.category.toLowerCase()))
    return Array.from(seen)
  }, [transactions])

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = search === '' ||
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'all' ||
        tx.category.toLowerCase().includes(activeCategory.toLowerCase())
      return matchSearch && matchCat
    })
  }, [transactions, search, activeCategory])

  // Totals (visible only)
  const visibleTxs = useMemo(() => filtered.filter(tx => !hidden.has(tx.transaction_id)), [filtered, hidden])
  const totalIncome   = visibleTxs.filter(t => t.amount > 0).reduce((s, t) =>  s + t.amount, 0)
  const totalSpending = visibleTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalNet      = totalIncome - totalSpending
  const hiddenCount   = filtered.filter(tx => hidden.has(tx.transaction_id)).length

  // Group filtered transactions by week
  const weekGroups = useMemo(() => {
    return weeks.map(w => ({
      week: w,
      txs: filtered.filter(tx => tx.value_date >= w.date_from && tx.value_date <= w.date_to),
    })).filter(g => g.txs.length > 0)
  }, [weeks, filtered])

  const label = monthLabel(date)

  return (
    <>
      <Nav />
      <main className="page">

        {/* ── Breadcrumb ────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => router.push(`/monthly?date=${date}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
          >
            ← {label}
          </button>
          <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Transactions</span>
        </div>

        {/* ── Page header ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Transactions
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {label} · {transactions.length} transactions
            </div>
          </div>
        </div>

        {/* ── Summary chips ─────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <Chip label="Income"   value={`+${fmtMoney(totalIncome)}`}   color="var(--positive)" />
          <Chip label="Spending" value={`−${fmtMoney(totalSpending)}`} color="var(--negative)" />
          <Chip label="Net" value={(totalNet >= 0 ? '+' : '−') + fmtMoney(totalNet)} color={totalNet >= 0 ? 'var(--blue)' : 'var(--negative)'} />
          <div style={{ marginLeft: 'auto' }}>
            <Chip label="Hidden" value={`${hiddenCount} transaction${hiddenCount !== 1 ? 's' : ''}`} color="var(--text-disabled)" />
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…"
              style={{
                width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-strong)',
                borderRadius: 'var(--r-md)', padding: '8px 12px 8px 32px',
                fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${activeCategory === cat ? 'var(--blue-border)' : 'var(--border-strong)'}`,
                  background: activeCategory === cat ? 'var(--blue-dim)' : 'var(--surface-1)',
                  color: activeCategory === cat ? 'var(--blue)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transaction table ─────────────────────── */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : weekGroups.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No transactions found</div>
          ) : (
            <>
              {weekGroups.map(({ week, txs }) => {
                const wIncome   = txs.filter(t => t.amount > 0 && !hidden.has(t.transaction_id)).reduce((s, t) => s + t.amount, 0)
                const wSpending = txs.filter(t => t.amount < 0 && !hidden.has(t.transaction_id)).reduce((s, t) => s + Math.abs(t.amount), 0)
                const isCurrentWeek = week.status === 'in_progress'
                return (
                  <div key={week.week_number}>
                    {/* Week group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 20px', background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--border)',
                      borderTop: isCurrentWeek ? '2px solid rgba(59,130,246,0.3)' : undefined,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                          fontSize: 12, fontWeight: 600,
                          color: isCurrentWeek ? 'var(--blue)' : 'var(--text-muted)',
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                        }}>
                          Week {week.week_number}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                          {fmtDate(week.date_from)} – {fmtDate(week.date_to)}
                        </span>
                        {isCurrentWeek && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                            ● In Progress
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {wIncome > 0 && <>
                          <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 12, fontWeight: 600, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }}>+{fmtMoney(wIncome)}</span>
                          <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>income</span>
                        </>}
                        {wSpending > 0 && <>
                          <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 12, fontWeight: 600, color: 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>−{fmtMoney(wSpending)}</span>
                          <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>spending</span>
                        </>}
                      </div>
                    </div>

                    {/* Transaction rows */}
                    {txs.map(tx => {
                      const isHidden = hidden.has(tx.transaction_id)
                      const catStyle = categoryStyle(tx.category)
                      const positive = tx.amount > 0
                      return (
                        <div
                          key={tx.transaction_id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
                            borderBottom: '1px solid var(--border)',
                            opacity: isHidden ? 0.35 : 1,
                          }}
                        >
                          <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums', width: 42, flexShrink: 0 }}>
                            {fmtDate(tx.value_date)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isHidden ? 'line-through' : 'none' }}>
                              {tx.description}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{tx.subcategory}</div>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: catStyle.bg, color: catStyle.color }}>
                              {catStyle.label}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                            fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                            width: 96, textAlign: 'right', flexShrink: 0,
                            color: positive ? 'var(--positive)' : 'var(--negative)',
                          }}>
                            {positive ? '+' : '−'}{fmtMoney(tx.amount)}
                          </span>
                          <button
                            onClick={() => toggleVisibility(tx)}
                            title={isHidden ? 'Show in totals' : 'Hide from totals'}
                            style={{
                              width: 28, height: 28, borderRadius: 'var(--r-sm)',
                              border: '1px solid var(--border-strong)', background: 'var(--surface-2)',
                              color: isHidden ? 'var(--text-disabled)' : 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', fontSize: 13, flexShrink: 0, marginLeft: 8,
                            }}
                          >
                            {isHidden ? '🙈' : '👁'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Grand total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {hiddenCount > 0 ? `${hiddenCount} transaction${hiddenCount !== 1 ? 's' : ''} hidden` : ''}
                </span>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <GrandTotalItem label="Total Income"   value={`+${fmtMoney(totalIncome)}`}   color="var(--positive)" />
                  <GrandTotalItem label="Total Spending" value={`−${fmtMoney(totalSpending)}`} color="var(--negative)" />
                  <GrandTotalItem label="Net" value={(totalNet >= 0 ? '+' : '−') + fmtMoney(totalNet)} color={totalNet >= 0 ? 'var(--blue)' : 'var(--negative)'} />
                </div>
              </div>
            </>
          )}
        </div>

      </main>
    </>
  )
}

// ── Small presentational helpers ──────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '9px 16px' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color }}>{value}</span>
    </div>
  )
}

function GrandTotalItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color }}>{value}</span>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsInner />
    </Suspense>
  )
}
