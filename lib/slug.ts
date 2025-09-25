import { nanoid } from 'nanoid'

// Generate a URL-safe slug for trades
export function generateTradeSlug(): string {
  // Use nanoid for short, URL-safe IDs
  return nanoid(8) // 8 characters should be sufficient for uniqueness
}

// Validate slug format
export function isValidSlug(slug: string): boolean {
  // Check if slug matches nanoid format (alphanumeric, 8 chars)
  return /^[A-Za-z0-9_-]{8}$/.test(slug)
}
