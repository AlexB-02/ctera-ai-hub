/** Detect JSON produced by the Portal feature-export SQL (export_json column). */
export function isPortalExportJson(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false
  const o = parsed as Record<string, unknown>
  if (!o.features || typeof o.features !== "object" || Array.isArray(o.features)) return false
  const features = o.features as Record<string, unknown>
  return (
    "Infrastructure" in features ||
    "Services" in features ||
    "Tenant Settings" in features ||
    "Global Settings" in features
  )
}
