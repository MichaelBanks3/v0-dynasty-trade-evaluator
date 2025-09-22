# PRD: Dynasty Fantasy Football Trade Evaluator (MVP)

## Scope (MVP)
- Dynasty only, **2-team trades** (players + rookie picks).
- League toggles: **Superflex**, **TE Premium**.
- **Mock valuation** first; basic recommendations “if feasible.”
- **Sleeper** import prioritized **post-MVP**.
- **Stack (locked)**: Next.js 14 (App Router) + **React 18** + TypeScript + Tailwind + shadcn/ui.
- **Auth**: Clerk (later). **DB**: Supabase (later). **Deploy**: Railway (later).

## Objectives
- Transparent, fast evaluation with simple UI.
- Customizable by league settings.
- Clear output: **fairness / lean** + **Win-Now vs Future** split.

## Non-Functional
- Mobile-friendly, accessible (ARIA + keyboard nav).
- Perceived evaluation <2s (mock OK).
- Minimal diffs; **no broad refactors** without instruction.
