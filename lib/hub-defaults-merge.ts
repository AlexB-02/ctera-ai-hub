/** Deep-fill missing keys from `defaults` without overwriting present values (recursive for plain objects). */
export function defaultsMerge<T extends Record<string, unknown>>(
  defaults: T,
  input: Record<string, unknown>,
): T {
  const out = { ...input } as Record<string, unknown>
  for (const key of Object.keys(defaults)) {
    const d = (defaults as Record<string, unknown>)[key]
    if (!(key in input) || input[key] === undefined) {
      out[key] = d
      continue
    }
    const i = input[key]
    if (
      d !== null &&
      typeof d === "object" &&
      !Array.isArray(d) &&
      i !== null &&
      typeof i === "object" &&
      !Array.isArray(i)
    ) {
      out[key] = defaultsMerge(d as Record<string, unknown>, i as Record<string, unknown>)
    }
  }
  return out as T
}
