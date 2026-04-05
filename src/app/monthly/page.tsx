'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/ui/Nav'
import Badge from '@/components/ui/Badge'
import {
  apiFetch,
  MonthlySummary,
  WeekEntry,
  BillsResponse,
} from '@/lib/api'

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtFull(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function prevMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function nextMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function isCurrentOrFuture(dateStr: string): boolean {
  const now = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  return d >= new Date(now.getFullYear(), now.getMonth(), 1)
}

function daysComplete(dateStr: string): number {
  const now = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  if (now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth()) {
    return now.getDate()
  }
  return 0
}

export default function MonthlyPage() {
  return (
    <Suspense fallback={<><Nav /><div className="page" style={{ color: 'var(--text-disabled)', fontSize: 14 }}>Loading…</div></>}>
      <MonthlyPageInner />
    </Suspense>
  )
}

function MonthlyPageInner() {
  const searchParams = useSearchParams()
  const paramDate = searchParams.get('date')

  const today = new Date()
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const [date, setDate] = useState(paramDate ?? defaultDate)

  const [summary, setSummary]   = useState<MonthlySummary | null>(null)
  const [weeks, setWeeks]       = useState<WeekEntry[]>([])
  const [bills, setBills]       = useState<BillsResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [savingsInput, setSavingsInput] = useState('')
  const [expectedIncome, setExpectedIncome] = useState('')
  const [includeBills, setIncludeBills] = useState(false)
  const savingsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore persisted UI state from localStorage on mount
  useEffect(() => {
    const storedExpected = localStorage.getItem('clarity_expected_income')
    if (storedExpected) setExpectedIncome(storedExpected)
    const storedBills = localStorage.getItem('clarity_include_bills')
    if (storedBills) setIncludeBills(storedBills === 'true')
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<MonthlySummary>(`/v1/monthly/summary?date=${date}`),
      apiFetch<WeekEntry[]>(`/v1/monthly/weeks?date=${date}`),
      apiFetch<BillsResponse>(`/v1/monthly/bills?date=${date}`),
    ]).then(([s, w, b]) => {
      setSummary(s)
      setSavingsInput(String(s.savings_goal))
      setWeeks(w)
      setBills(b)
      setLoading(false)
    }).catch(console.error)
  }, [date])

  const handleSavingsChange = (val: string) => {
    setSavingsInput(val)
    if (savingsDebounce.current) clearTimeout(savingsDebounce.current)
    savingsDebounce.current = setTimeout(async () => {
      const amount = parseFloat(val) || 0
      try {
        await apiFetch(`/v1/monthly/savings_goal?date=${date}&amount=${amount}`, { method: 'PUT' })
        const s = await apiFetch<MonthlySummary>(`/v1/monthly/summary?date=${date}`)
        setSummary(s)
      } catch (e) { console.error(e) }
    }, 600)
  }

  const today2 = new Date()
  const viewedDate = new Date(date + 'T00:00:00')
  const isCurrentMonth = viewedDate.getFullYear() === today2.getFullYear() && viewedDate.getMonth() === today2.getMonth()

  const expectedVal = isCurrentMonth ? (parseFloat(expectedIncome) || 0) : 0
  const billsAdj = includeBills ? (bills?.total_upcoming ?? 0) : 0
  const totalIncome = (summary?.income ?? 0) + expectedVal
  const effectiveSpending = (summary?.spending ?? 0) + billsAdj
  const effectiveRemainingBudget = (summary?.remaining_budget ?? 0) + expectedVal - billsAdj

  const totalRemainingDays = weeks.reduce((sum, w) => {
    if (w.status === 'in_progress') return sum + w.days_remaining
    if (w.status === 'upcoming') return sum + w.days_total
    return sum
  }, 0)
  const dailyRate = totalRemainingDays > 0 ? effectiveRemainingBudget / totalRemainingDays : 0

  const canGoNext = !isCurrentOrFuture(date)

  return (
    <>
      <Nav />
      <main className="page">

        {/* ── Page header ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setDate(prevMonth(date))}
              style={navBtnStyle}
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
                {monthLabel(date)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Monthly snapshot{daysComplete(date) > 0 ? ` · ${daysComplete(date)} days complete` : ''}
              </div>
            </div>
            <button
              onClick={() => { if (canGoNext) setDate(nextMonth(date)) }}
              style={{ ...navBtnStyle, opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'default' }}
            >
              →
            </button>
          </div>
          <Link
            href={`/transactions?date=${date}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)',
              padding: '8px 16px',
            }}
          >
            Transactions →
          </Link>
        </div>

        {/* ── Summary cards ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {/* Income */}
          <SummaryCard variant="green" label="Total Income">
            <div style={{ ...sumValueStyle, color: 'var(--positive)' }}>
              {summary ? fmt(totalIncome) : '—'}
            </div>
            {isCurrentMonth && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--border)', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confirmed</span>
                  <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 12, fontWeight: 600, color: 'var(--positive)', fontVariantNumeric: 'tabular-nums' }}>
                    {summary ? fmt(summary.income) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+ Expected</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expectedIncome}
                      onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setExpectedIncome(val)
                    localStorage.setItem('clarity_expected_income', val)
                  }}
                      placeholder="0"
                      aria-label="Expected income this month"
                      style={{
                        fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--warning)',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                        width: 72,
                        textAlign: 'right',
                        borderBottom: '1px dashed rgba(245,158,11,0.4)',
                        paddingBottom: 1,
                      }}
                    />
                  </div>
                </div>
                {expectedVal > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'var(--warning-dim)', color: 'var(--warning)', marginTop: 6 }}>
                    ◆ includes projected income
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>✎ Enter income you expect to receive</div>
              </>
            )}
          </SummaryCard>

          {/* Spending */}
          <SummaryCard variant="red" label="Total Spending">
            <div style={{ ...sumValueStyle, color: 'var(--negative)' }}>
              {summary ? fmt(effectiveSpending) : '—'}
            </div>
            {summary?.vs_previous_month && (
              <div style={{ fontSize: 12, color: 'var(--negative)', opacity: 0.7 }}>
                ↑ {fmt(summary.vs_previous_month.spending_delta)} vs last month
              </div>
            )}
            {bills && bills.total_upcoming > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--border)', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Include upcoming bills</span>
                  <Toggle on={includeBills} onToggle={() => {
                    const next = !includeBills
                    setIncludeBills(next)
                    localStorage.setItem('clarity_include_bills', String(next))
                  }} />
                </div>
                {includeBills && (
                  <div style={{ fontSize: 11, color: 'var(--negative)', opacity: 0.7 }}>
                    + {fmt(bills.total_upcoming)} bills remaining
                  </div>
                )}
              </>
            )}
          </SummaryCard>

          {/* Savings goal (editable) */}
          <SummaryCard variant="amber" label={<>Savings Goal <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-disabled)', letterSpacing: 0 }}>(editable)</span></>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 22, fontWeight: 600, color: 'var(--warning)' }}>$</span>
              <input
                type="number"
                value={savingsInput}
                onChange={e => handleSavingsChange(e.target.value)}
                min={0}
                step={50}
                style={{
                  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--warning)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  width: 100,
                  borderBottom: '1px dashed rgba(245,158,11,0.4)',
                  paddingBottom: 1,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>✎ Click to change goal</div>
          </SummaryCard>

          {/* Remaining budget */}
          <SummaryCard variant="blue" label="Remaining Budget">
            <div style={{
              ...sumValueStyle,
              color: effectiveRemainingBudget < 0
                ? 'var(--negative)'
                : effectiveRemainingBudget < 300
                  ? 'var(--warning)'
                  : 'var(--blue)',
            }}>
              {summary ? (effectiveRemainingBudget < 0 ? '−' : '') + fmt(effectiveRemainingBudget) : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              After saving {summary ? fmt(summary.savings_goal) : '—'} goal
            </div>
          </SummaryCard>
        </div>

        {/* ── Week by week ──────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
          Week by Week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, 1fr)`, gap: 12, marginBottom: 26 }}>
          {weeks.map(week => (
            <WeekCard
              key={week.week_number}
              week={week}
              dailyRate={dailyRate}
              totalRemainingDays={totalRemainingDays}
            />
          ))}
          {weeks.length === 0 && loading && (
            <div style={{ color: 'var(--text-disabled)', fontSize: 13 }}>Loading…</div>
          )}
        </div>

        {/* ── Bills ─────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
          Bills
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Paid */}
          <BillsCard title="Paid" badge={`${bills?.paid.length ?? 0} paid`} badgeType="paid">
            {bills?.paid.map(b => (
              <BillRow key={b.transaction_id}>
                <div style={{ flex: 1 }}>
                  <div style={billNameStyle}>{b.description}</div>
                  <div style={billDateStyle}>Paid {parseDate(b.date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...billAmtStyle, color: 'var(--text-secondary)' }}>{fmtFull(b.amount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--positive)', marginTop: 2 }}>✓ Paid</div>
                </div>
              </BillRow>
            ))}
            <div style={billsTotalStyle}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total paid</span>
              <span style={{ ...billsTotalValStyle, color: 'var(--positive)' }}>{bills ? fmtFull(bills.total_paid) : '—'}</span>
            </div>
          </BillsCard>

          {/* Upcoming */}
          <BillsCard title="Remaining" badge={`${bills?.upcoming.length ?? 0} upcoming`} badgeType="upcoming">
            {bills?.upcoming.map(b => (
              <BillRow key={b.transaction_id}>
                <div style={{ flex: 1 }}>
                  <div style={billNameStyle}>{b.description}</div>
                  <div style={billDateStyle}>Due {parseDate(b.expected_date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...billAmtStyle, color: 'var(--text-primary)' }}>{fmtFull(b.amount)}</div>
                  <div style={{
                    fontSize: 11,
                    color: b.days_until_due <= 7 ? 'var(--blue)' : 'var(--text-muted)',
                    marginTop: 2,
                  }}>
                    Due in {b.days_until_due} days
                  </div>
                </div>
              </BillRow>
            ))}
            <div style={billsTotalStyle}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total remaining</span>
              <span style={{ ...billsTotalValStyle, color: 'var(--warning)' }}>{bills ? fmtFull(bills.total_upcoming) : '—'}</span>
            </div>
          </BillsCard>
        </div>
      </main>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: on ? 'var(--blue)' : 'var(--surface-3)',
        border: '1px solid ' + (on ? 'var(--blue)' : 'var(--border-strong)'),
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        position: 'relative',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: on ? 14 : 2,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.15s',
      }} />
    </button>
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

const VARIANT_ACCENT: Record<string, string> = {
  green: 'var(--positive)',
  red:   'var(--negative)',
  blue:  'var(--blue)',
  amber: 'var(--warning)',
}

function SummaryCard({ variant, label, children }: {
  variant: string
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        background: `linear-gradient(90deg, ${VARIANT_ACCENT[variant]}, transparent)`,
      }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const sumValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
  marginBottom: 6,
}

function WeekCard({ week, dailyRate, totalRemainingDays }: {
  week: WeekEntry
  dailyRate: number
  totalRemainingDays: number
}) {
  const isUpcoming   = week.status === 'upcoming'
  const isInProgress = week.status === 'in_progress'
  const isComplete   = week.status === 'complete'
  const pctElapsed   = week.days_total > 0 ? (week.days_elapsed / week.days_total) * 100 : 0

  const allocDays = isInProgress ? week.days_remaining : week.days_total
  const allocBudget = dailyRate * allocDays
  const allocPct = totalRemainingDays > 0 ? (allocDays / totalRemainingDays) * 100 : 0
  const showAlloc = (isInProgress || isUpcoming) && totalRemainingDays > 0

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: isInProgress
        ? '1px solid rgba(59,130,246,0.3)'
        : isUpcoming
          ? '1px solid rgba(59,130,246,0.18)'
          : '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '18px 16px',
      position: 'relative',
      overflow: 'hidden',
      opacity: isUpcoming ? 0.75 : 1,
      boxShadow: isInProgress ? '0 0 16px rgba(59,130,246,0.08)' : undefined,
    }}>
      {/* Blue top line for in-progress */}
      {isInProgress && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--blue)' }} />
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Week {week.week_number}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 1 }}>
          {parseDate(week.date_from)} – {parseDate(week.date_to)}
        </div>
        <div style={{ marginTop: 4 }}>
          {isComplete   && <Badge variant="done">✓ Complete</Badge>}
          {isInProgress && <Badge variant="active">● In Progress</Badge>}
          {isUpcoming   && <Badge variant="active">• Budget</Badge>}
        </div>
      </div>

      {/* Budget allocation — shown for in-progress and upcoming weeks */}
      {showAlloc && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Remaining budget allocated
          </div>
          <div style={{ fontFamily: 'var(--font-lexend, Lexend, sans-serif)', fontSize: 20, fontWeight: 600, color: allocBudget < 0 ? 'var(--negative)' : 'var(--blue)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginBottom: 2 }}>
            {(allocBudget < 0 ? '−' : '') + fmt(allocBudget)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            ~{(dailyRate < 0 ? '−' : '') + fmt(dailyRate)} / day · {allocDays} day{allocDays !== 1 ? 's' : ''}
          </div>
          <div style={{ height: 3, background: 'rgba(59,130,246,0.12)', borderRadius: 2, marginTop: 8 }}>
            <div style={{
              height: 3,
              borderRadius: 2,
              background: 'linear-gradient(90deg, var(--blue), rgba(59,130,246,0.4))',
              width: `${allocPct}%`,
            }} />
          </div>
        </>
      )}

      {/* Stats rows — shown for complete and in-progress; hidden for upcoming */}
      {!isUpcoming && (
        <>
          {showAlloc && <div style={{ borderTop: '1px dashed rgba(255,255,255,0.07)', margin: '8px 0' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Income',  value: week.income,  color: 'var(--positive)', prefix: '+' },
              { label: 'Spending',value: week.spending, color: 'var(--negative)', prefix: '−' },
              { label: isComplete ? 'Net' : 'Running', value: isComplete ? week.net : week.running_total, color: 'var(--blue)', prefix: '' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{
                  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: row.color,
                }}>
                  {row.value == null ? '—' : `${row.prefix}${fmt(row.value)}`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Days progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTop: '1px solid var(--border)',
        marginTop: isUpcoming ? 12 : 8,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Days</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '0 8px' }}>
          <div style={{
            height: 3,
            borderRadius: 2,
            background: 'var(--blue)',
            width: `${isUpcoming ? 0 : pctElapsed}%`,
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
          fontSize: 12,
          fontWeight: 600,
          color: isInProgress ? 'var(--blue)' : isUpcoming ? 'var(--text-muted)' : 'var(--text-secondary)',
        }}>
          {isUpcoming
            ? `${week.days_total} days`
            : isInProgress
              ? `${week.days_remaining} left`
              : `${week.days_elapsed}/${week.days_total}`}
        </span>
      </div>
    </div>
  )
}

function BillsCard({ title, badge, badgeType, children }: {
  title: string
  badge: string
  badgeType: 'paid' | 'upcoming'
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {title}
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 20,
          background: badgeType === 'paid' ? 'var(--positive-dim)' : 'var(--warning-dim)',
          color: badgeType === 'paid' ? 'var(--positive)' : 'var(--warning)',
        }}>
          {badge}
        </span>
      </div>
      {children}
    </div>
  )
}

function BillRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

const billNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-primary)',
}
const billDateStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginTop: 1,
}
const billAmtStyle: React.CSSProperties = {
  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
  fontSize: 14,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}
const billsTotalStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: 'var(--surface-2)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid var(--border)',
}
const billsTotalValStyle: React.CSSProperties = {
  fontFamily: 'var(--font-lexend, Lexend, sans-serif)',
  fontSize: 15,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}
