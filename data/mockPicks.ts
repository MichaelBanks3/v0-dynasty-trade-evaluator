export interface Pick {
  id: string
  label: string
  baseValue: number
  type: "pick"
}

export const mockPicks: Pick[] = [
  { id: "2025-1st-early", label: "2025 1st (Early)", baseValue: 45, type: "pick" },
  { id: "2025-1st-mid", label: "2025 1st (Mid)", baseValue: 40, type: "pick" },
  { id: "2025-1st-late", label: "2025 1st (Late)", baseValue: 35, type: "pick" },
  { id: "2025-2nd-early", label: "2025 2nd (Early)", baseValue: 20, type: "pick" },
  { id: "2025-2nd-mid", label: "2025 2nd (Mid)", baseValue: 18, type: "pick" },
  { id: "2025-2nd-late", label: "2025 2nd (Late)", baseValue: 15, type: "pick" },
  { id: "2025-3rd", label: "2025 3rd", baseValue: 8, type: "pick" },
  { id: "2026-1st-early", label: "2026 1st (Early)", baseValue: 42, type: "pick" },
  { id: "2026-1st-mid", label: "2026 1st (Mid)", baseValue: 37, type: "pick" },
  { id: "2026-1st-late", label: "2026 1st (Late)", baseValue: 32, type: "pick" },
  { id: "2026-2nd-early", label: "2026 2nd (Early)", baseValue: 18, type: "pick" },
  { id: "2026-2nd-mid", label: "2026 2nd (Mid)", baseValue: 16, type: "pick" },
  { id: "2026-2nd-late", label: "2026 2nd (Late)", baseValue: 13, type: "pick" },
  { id: "2026-3rd", label: "2026 3rd", baseValue: 6, type: "pick" },
  { id: "2027-1st", label: "2027 1st", baseValue: 30, type: "pick" },
  { id: "2027-2nd", label: "2027 2nd", baseValue: 12, type: "pick" },
]
