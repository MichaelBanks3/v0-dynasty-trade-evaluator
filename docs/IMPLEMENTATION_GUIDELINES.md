# Implementation Guidelines

1) **Do NOT upgrade React** beyond 18 or Next beyond 14 unless explicitly told.
2) Prefer **minimal diffs**; do not restructure folders without instruction.
3) Keep **shadcn/ui**; avoid deps that break React 18 (e.g., incompatible `vaul`).
4) **Accessibility**: focus states, keyboard navigation, ARIA roles/labels, empty states.
5) **Testability**: add `data-testid` to key elements (search input, add buttons, evaluate button, totals).
6) Commit **atomic changes** with clear messages.
7) If scope needs to change, update **PRD** and this file in the same PR.
