# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # Run ESLint
```

There is no test suite configured.

## Architecture

**Next.js 14 App Router** frontend — "Clarity" personal finance dashboard.

### Routes
- `/` — Home dashboard (KPIs, chart, budget categories, savings goal, recent transactions)
- `/monthly` — Monthly snapshot (summary, week-by-week, bills). Accepts `?date=YYYY-MM-DD` query param.
- `/yearly` — Yearly overview (YTD KPIs, bar chart, month table)

### Backend API
Base URL in `.env.local` as `NEXT_PUBLIC_API_BASE` (defaults to `http://0.0.0.0:8000`). All fetches go through `src/lib/api.ts` which exports `apiFetch<T>()` and all TypeScript response types.

Key endpoint groups:
- `GET /v1/home/*` — summary, chart (W/M/Y), budget_categories, savings_goal, recent_transactions
- `GET /v1/monthly/*` — summary, weeks, bills; `PUT /v1/monthly/savings_goal`
- `GET /v1/yearly/*` — years, summary (with sparklines + YoY), months
- `POST /v1/transactions/set_visibility/{id}` — hide a transaction

### Design system
All CSS custom properties (colors, radius, shadows, motion) are defined once in `src/app/globals.css`. Tailwind `tailwind.config.ts` maps those vars to utility class names. Never hardcode color hex values in components — use `var(--token-name)`.

Fonts loaded via `next/font/google` in `layout.tsx`: **Lexend** (`--font-lexend`) for headings/numbers, **Source Sans 3** (`--font-source-sans`) for body text.

### Components
Shared UI lives in `src/components/ui/`:
- `Nav.tsx` — sticky navbar (active link detection via `usePathname`)
- `KpiCard.tsx` — top-accent stat card with variant prop (`green`/`red`/`blue`/`amber`)
- `Card.tsx` + `CardHeader` — generic surface card
- `Badge.tsx` — status pills (`up`/`down`/`done`/`active`/`upcoming`)
- `ProgressBar.tsx` — budget category row with status-colored fill
- `LineChart.tsx` — SVG area/line chart for home page (income/spending/net cumulative)
- `BarChart.tsx` — SVG grouped bar chart for yearly page (12 months)
- `Sparkline.tsx` — compact inline SVG sparkline for YTD cards

### State
All pages are `'use client'` components using React `useState`/`useEffect`. No global state library. The monthly page wraps its inner component in `<Suspense>` because it uses `useSearchParams()`.

### Path alias
`@/*` maps to `./src/*`.
