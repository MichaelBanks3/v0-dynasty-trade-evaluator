# Architecture (MVP)

## Routes
- `/` (Landing): hero + CTA to `/dashboard`.
- `/dashboard`: cards for **Create Trade**, **Recent Trades** (mock), **League Settings** (mock).
- `/trade/new`: **Two-column builder** (Team A / Team B), league toggles (Superflex/TEP), running totals, “Evaluate Trade” button → `/trade/result`.
- `/trade/result`: fairness meter (leans A/B/Even), **Win-Now vs Future** bars, transparent breakdown (assets + mock base values + subtotals).

## Components
- `PlayerSearch`: search/autocomplete, keyboard support, type badge (`player`/`pick`).
- `TradeBuilder`: two lists (A/B), add/remove assets, show per-side totals.
- `TradeSummary`: totals + lean/fairness calculation.
- `WinNowFutureChart`: **CSS/SVG** only (no chart lib).

## Data & State
- Mock data: `/data/mockPlayers.ts`, `/data/mockPicks.ts`.
- State: **Zustand** (`src/lib/stores.ts`) or local state (keep simple).
- API placeholder: `POST /api/evaluate` returns mock evaluation `{ fairness, lean, winNow, future }`.

## Future (not in Task 01)
- Clerk auth (protect app routes).
- Supabase (schema, RLS, save/read trades).
- Sleeper league import.
