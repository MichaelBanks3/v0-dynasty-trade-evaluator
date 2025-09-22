# Task 03: Authentication with Clerk (MVP)

## Goal
Gate the app experience behind Clerk while keeping the landing page public. Add sign in/out UI, protect app routes, and ensure local dev is smooth.

## Acceptance Criteria

1) **Clerk setup (Next 14 / React 18)**
   - Install (or confirm) `@clerk/nextjs`.
   - Wrap the **app** layout with `<ClerkProvider>` (in a top-level layout that covers `/dashboard` and `/trade/*`; landing `/` remains public).
   - Add the standard Clerk pages/routes:
     - `/sign-in` and `/sign-up` using Clerk components.
   - Environment variables expected in `.env.local` (do NOT hardcode):
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-pk>
     CLERK_SECRET_KEY=<your-sk>
     ```
   - If keys are missing in local dev, show a **friendly placeholder banner** in the app routes (not on landing) guiding the user to add keys, but allow the app to still boot without crashes.

2) **Route protection**
   - **Public:** `/` (landing) only.
   - **Protected (requires sign-in):** `/dashboard`, `/trade/new`, `/trade/result`.
   - Implement protection using Clerk’s recommended approach for the App Router (e.g., `auth()` in server components or middleware with `createRouteMatcher`).
   - When unauthenticated users hit protected routes, they should be redirected to `/sign-in` (and after sign-in, returned to the originally requested route).

3) **Header authentication UI**
   - In the top nav (already exists), add:
     - If **signed out**: `Sign in` link/button → `/sign-in`.
     - If **signed in**: Clerk `UserButton` (avatar menu) and a visible `Sign out`.
   - Keep styling consistent with shadcn/ui.
   - Add `data-testid` for `auth-signin-link`, `auth-user-button`, and `auth-signout-button`.

4) **Do not break existing flows**
   - The landing page `/` still works without auth.
   - The existing clickthrough (create trade → evaluate → result) works **when signed in**.
   - `/api/evaluate` remains **public** in this task (we’ll scope/tighten later), but it should **not crash** if called while signed out.

5) **Minimal diffs / types**
   - Keep React 18 / Next 14; no upgrades.
   - Minimal file changes; no folder reshuffles.
   - Centralize any new auth-related types or helpers in `src/lib/auth.ts` if needed.

## Implementation Notes
- Add a simple `AuthGuard` server component (or use middleware) for protected routes to keep pages clean.
- Keep the sign-in/up pages simple using Clerk primitives.
- Handle missing env keys in dev by rendering an inline alert on protected routes that explains how to add keys to `.env.local` (but don’t crash or throw).

## Output (from Cursor when done)
- Short summary of changes
- Files created/edited (full paths)
- One commit message
