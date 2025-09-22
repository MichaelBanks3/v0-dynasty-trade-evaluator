# Task 01: Complete v0 click-through (UI only)

## Goal
From landing → dashboard → trade builder → result using **mock data** and a **mock evaluation**.

## Acceptance Criteria
- `/dashboard`: cards for **Create Trade**, **Recent Trades** (mock list), **League Settings** (mock).
- `/trade/new`:
  - Search adds/removes **players** and **picks** to **Team A** or **Team B**.
  - League toggles: **Superflex**, **TE Premium**.
  - Running **totals per side** visible at all times.
  - Clicking **Evaluate Trade** navigates to `/trade/result` and carries state (store or serialized in URL).
- `/trade/result`:
  - Shows **fairness meter** (leans A, B, or Even) and **Win-Now vs Future** bars.
  - Transparent breakdown: assets by side with **mock baseValue** and **subtotals**.
  - Friendly **empty state** if user lands without state (e.g., direct URL).

## Constraints
- **No auth, no DB**, no external chart lib.
- Minimal edits to existing files; create new components in `src/components`.
- Use `/data/mockPlayers.ts` and `/data/mockPicks.ts` for data.
- Provide a **`POST /api/evaluate`** endpoint that returns the same evaluation shape the UI expects.

## Output (from Cursor when done)
- A short summary of changes
- List of files created/edited
- One commit message
