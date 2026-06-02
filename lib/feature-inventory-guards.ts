/**
 * Detect feature-inventory export shape: non-empty array of objects with portal_name, feature, status.
 * (Strings may be coerced later on the server.)
 */
export function isFeatureInventoryArray(parsed: unknown): boolean {
  if (!Array.isArray(parsed) || parsed.length === 0) return false
  const first = parsed[0]
  if (!first || typeof first !== "object") return false
  const o = first as Record<string, unknown>
  return (
    typeof o.portal_name !== "undefined" &&
    typeof o.feature !== "undefined" &&
    typeof o.status !== "undefined"
  )
}
