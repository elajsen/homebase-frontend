export const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://0.0.0.0:8000'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, options)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

// ── Home types ────────────────────────────────────────────────────────────────

export interface VsPreviousMonth {
  label: string
  income_delta: number
  income_pct: number
  spending_delta: number
  spending_pct: number
  net_delta: number
  net_pct: number
}

export interface HomeSummary {
  income: number
  spending: number
  remaining: number
  savings_rate: number
  vs_previous_month: VsPreviousMonth
}

export interface ChartBucket {
  label: string
  date_from: string
  date_to: string
  income: number
  spending: number
  net: number
}

export interface ChartResponse {
  period: string
  buckets: ChartBucket[]
}

export interface RecentTransaction {
  transaction_id: string
  description: string
  category: string
  amount: number
  value_date: string
}

export interface BudgetCategory {
  id: string
  name: string
  spent: number
  budget: number
  pct: number
  status: 'ok' | 'warning' | 'over'
}

export interface SavingsGoal {
  goal: number
  saved: number
  remaining: number
  pct: number
}

// ── Transaction types ─────────────────────────────────────────────────────────

export interface Transaction {
  transaction_id: string
  category: string
  subcategory: string
  description: string
  amount: number
  value_date: string
  booking_date: string
  is_visible: boolean
}

// ── Monthly types ─────────────────────────────────────────────────────────────

export interface MonthlySummary {
  income: number
  spending: number
  savings_goal: number
  remaining_budget: number
  vs_previous_month: {
    income_delta: number
    spending_delta: number
  }
}

export interface WeekEntry {
  week_number: number
  date_from: string
  date_to: string
  status: 'complete' | 'in_progress' | 'upcoming'
  income: number | null
  spending: number | null
  net: number | null
  running_total: number | null
  budget: number | null
  days_total: number
  days_elapsed: number
  days_remaining: number
}

export interface PaidBill {
  transaction_id: string
  description: string
  amount: number
  date: string
}

export interface UpcomingBill {
  transaction_id: string
  description: string
  amount: number
  expected_date: string
  days_until_due: number
}

export interface BillsResponse {
  paid: PaidBill[]
  upcoming: UpcomingBill[]
  total_paid: number
  total_upcoming: number
}

// ── Yearly types ──────────────────────────────────────────────────────────────

export interface YoYStats {
  income_pct: number | null
  spending_pct: number | null
  net_pct: number | null
}

export interface Sparklines {
  income: number[]
  spending: number[]
  net: number[]
}

export interface YearlySummary {
  year: number
  months_with_data: number
  total_income_ytd: number
  total_spending_ytd: number
  net_profit_ytd: number
  avg_monthly_income: number
  avg_monthly_spending: number
  savings_rate_ytd: number
  yoy: YoYStats
  sparklines: Sparklines
}

export interface MonthEntry {
  month: string
  label: string
  income: number | null
  spending: number | null
  profit: number | null
  savings_rate: number | null
  status: 'complete' | 'current' | 'future'
}
