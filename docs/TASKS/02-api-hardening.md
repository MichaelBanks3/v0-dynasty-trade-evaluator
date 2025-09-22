# Task 02: API hardening, validation, and resilient UI states

## Goal
Make the mock evaluation flow robust and predictable: strict input validation on the API, shared evaluation logic, and explicit loading/error/empty UI states.

## Acceptance Criteria

1) **Schema validation (server)**
   - In `app/api/evaluate/route.ts`, validate the POST body.
   - Prefer **zod** *only if it already exists in the project*. If not, implement a **minimal runtime validator** (no heavy new deps).
   - Expected payload:
     ```ts
     {
       teamA: Array<{ id: string; type: 'player'|'pick'; label: string; baseValue: number }>,
       teamB: Array<{ id: string; type: 'player'|'pick'; label: string; baseValue: number }>,
       settings: { superflex: boolean; tePremium: boolean }
     }
     ```
   - On invalid input: return **400** with JSON `{ error: 'Invalid payload', issues: [...] }`.
   - On success: return JSON:
     ```ts
     {
       fairness: number,    // 0–100
       lean: 'A' | 'B' | 'Even',
       winNow: number,      // 0–100
       future: number,      // 0–100
       totals: { A: number, B: number },
       settings: { superflex: boolean; tePremium: boolean }
     }
     ```

2) **Shared evaluation helper**
   - Move the mock evaluation math to `src/lib/valuation.ts` as a pure function used by both:
     - the API route, and
     - the UI (if any client calc remains).
   - Ensure **league toggles** (Superflex/TEP) influence totals/evaluation consistently via this helper.

3) **Resilient UI states on `/trade/result`**
   - Handle three explicit states:
     - **loading** (initial fetch) → show a simple loader/skeleton.
     - **error** (request failed or invalid payload) → show a friendly inline message with a “Back to builder” button.
     - **empty** (user navigated directly without trade data) → keep the existing empty state and make it explicit.
   - Keep or add `data-testid` for: `totals-A`, `totals-B`, `fairness`, `win-now-bar`, `future-bar`, `error-state`, `empty-state`.

4) **Type safety**
   - Centralize request/response types in `src/lib/types.ts` and import them in:
     - `app/api/evaluate/route.ts`
     - any UI files that rely on the evaluation shape

5) **No new heavy deps**
   - Do not add chart libs or state libs.
   - Only use zod if it is **already** present; otherwise do a lightweight validator.

## Constraints
- **React 18 / Next 14**, do not upgrade.
- Minimal diffs; do not restructure folders.
- Keep shadcn/ui; avoid deps like incompatible `vaul`.

## Output (from Cursor when done)
- Short summary of changes
- Files created/edited (full paths)
- One commit message

## Notes
- Preserve the existing clickthrough flow from Task 01.
- API response should be stable and predictable (no randomization).
