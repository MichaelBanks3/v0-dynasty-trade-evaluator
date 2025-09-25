/**
 * Safety utilities to prevent undefined/null array errors
 */

/**
 * Ensures a value is always an array (returns empty array if undefined/null)
 */
export function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

/**
 * Ensures a value is wrapped as an array, or returns empty array if null
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

/**
 * Safely gets a property from an object, returning a default if undefined
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue
      }
      result = result[key]
    }
    return result !== undefined ? result : defaultValue
  } catch {
    return defaultValue
  }
}
