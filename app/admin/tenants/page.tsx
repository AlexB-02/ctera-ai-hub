"use client"

import { useState, useMemo, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Search, Users, HardDrive, Upload, FileJson } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { CopyableCollapsibleSnippet } from "@/components/copyable-collapsible-snippet"
import { cn } from "@/lib/utils"
import { isFeatureInventoryArray } from "@/lib/feature-inventory-guards"
import { isPortalExportJson } from "@/lib/portal-export-guards"
import { PORTAL_IMPORT_JSON_SQL } from "@/lib/tenant-onboarding-templates"
import { useRouter } from "next/navigation"

const adoptionTier = (pct: number) => {
  if (pct >= 80) return { label: "High", className: "text-success bg-success/10 border-success/30", color: "var(--success)", bar: "bg-success" }
  if (pct >= 60) return { label: "Medium", className: "text-primary bg-primary/10 border-primary/30", color: "var(--primary)", bar: "bg-primary" }
  if (pct >= 40) return { label: "Low", className: "text-warning bg-warning/10 border-warning/30", color: "var(--warning)", bar: "bg-warning" }
  return { label: "Very Low", className: "text-critical bg-critical/10 border-critical/30", color: "var(--critical)", bar: "bg-critical" }
}

const statusStyle = (status: string) => {
  switch (status) {
    case "active": return "text-success bg-success/10 border-success/30"
    case "trial": return "text-warning bg-warning/10 border-warning/30"
    case "suspended": return "text-critical bg-critical/10 border-critical/30"
    default: return "text-muted-foreground bg-muted border-border"
  }
}

const plans = ["All", "Enterprise", "Business", "Starter"]
const statuses = ["All", "active", "trial", "suspended"]

function firstJsonFileFromDataTransfer(dt: DataTransfer): File | null {
  const list = [...dt.files]
  return (
    list.find(
      (f) =>
        f.name.toLowerCase().endsWith(".json") ||
        f.type === "application/json" ||
        f.type === "text/json",
    ) ?? null
  )
}

export default function AdminTenantsPage() {
  const { hub, reload } = useHub()
  const { tenants, globalStats } = hub
  const { customers, allDeployments, setScope } = useTenant()

  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonPaste, setJsonPaste] = useState("")
  const [adminToken, setAdminToken] = useState("")
  const [portalFilter, setPortalFilter] = useState("")
  const [importBusy, setImportBusy] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const dropDepth = useRef(0)
  const [dropActive, setDropActive] = useState(false)

  const authHeaders = (): HeadersInit => {
    const t = adminToken.trim()
    if (!t) return {}
    return { Authorization: `Bearer ${t}` }
  }

  const normalizeImportPayload = (parsed: unknown): unknown => {
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const o = parsed as Record<string, unknown>
      if (typeof o.export_json === "string") {
        try {
          return JSON.parse(o.export_json)
        } catch {
          return parsed
        }
      }
    }
    return parsed
  }

  const featureInventoryRowsFromParsed = (parsed: unknown): unknown[] | null => {
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)) {
      return (parsed as { rows: unknown[] }).rows
    }
    return null
  }

  const importPortalExportPayload = async (body: unknown) => {
    const q = portalFilter.trim()
    const url = q
      ? `/api/hub-data/tenant/from-portal-export?portal=${encodeURIComponent(q)}`
      : "/api/hub-data/tenant/from-portal-export"
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      mode?: string
      tenant?: { name?: string; id?: string }
      details?: unknown
    }
    if (!res.ok) {
      let msg = typeof data.error === "string" ? data.error : res.statusText
      if (data.details != null) {
        try {
          msg += ` ${JSON.stringify(data.details)}`
        } catch {
          /* ignore */
        }
      }
      setImportError(msg)
      return
    }
    setImportMessage(
      data.mode === "updated"
        ? `Updated tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}” from Portal export.`
        : `Added tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}” from Portal export.`,
    )
    await reload()
  }

  const importFeatureInventoryPayload = async (body: unknown) => {
    const q = portalFilter.trim()
    const url = q
      ? `/api/hub-data/tenant/from-features?portal=${encodeURIComponent(q)}`
      : "/api/hub-data/tenant/from-features"
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      imported?: { tenant: { name?: string; id?: string }; mode: string }[]
      details?: unknown
    }
    if (!res.ok) {
      let msg = typeof data.error === "string" ? data.error : res.statusText
      if (data.details != null) {
        try {
          msg += ` ${JSON.stringify(data.details)}`
        } catch {
          /* ignore */
        }
      }
      setImportError(msg)
      return
    }
    const list = data.imported ?? []
    const names = list.map((i) => i.tenant?.name ?? i.tenant?.id ?? "—").join(", ")
    setImportMessage(list.length ? `Imported ${list.length} tenant(s) from feature inventory: ${names}` : "Done")
    await reload()
  }

  const importSingleTenantPayload = async (body: unknown) => {
    const res = await fetch("/api/hub-data/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      mode?: string
      tenant?: { name?: string; id?: string }
      details?: unknown
    }
    if (!res.ok) {
      let msg = typeof data.error === "string" ? data.error : res.statusText
      if (data.details != null) {
        try {
          msg += ` ${JSON.stringify(data.details)}`
        } catch {
          /* ignore */
        }
      }
      setImportError(msg)
      return
    }
    setImportMessage(
      data.mode === "updated"
        ? `Updated tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`
        : `Added tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`,
    )
    await reload()
  }

  const importJsonPayload = async (rawParsed: unknown) => {
    setImportMessage(null)
    setImportError(null)
    setImportBusy(true)
    try {
      const parsed = normalizeImportPayload(rawParsed)
      if (isPortalExportJson(parsed)) {
        await importPortalExportPayload(parsed)
        return
      }
      const rows = featureInventoryRowsFromParsed(parsed)
      if (rows && isFeatureInventoryArray(rows)) {
        await importFeatureInventoryPayload(parsed)
        return
      }
      await importSingleTenantPayload(parsed)
    } catch {
      setImportError("Import failed")
    } finally {
      setImportBusy(false)
    }
  }

  const importJsonFromText = async (rawText: string, clearPaste = false) => {
    const normalized = rawText.replace(/^\uFEFF/, "").trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(normalized)
    } catch {
      setImportError("Paste valid JSON.")
      return
    }
    await importJsonPayload(parsed)
    if (clearPaste) setJsonPaste("")
  }

  const importJsonFromFile = async (file: File) => {
    await importJsonFromText(await file.text())
    if (fileRef.current) fileRef.current.value = ""
  }

  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const router = useRouter()

  const deploymentRows = useMemo(() => {
    return allDeployments
      .map((deployment) => {
        const customer = customers.find((c) => c.id === deployment.customerId)
        return customer ? { customer, deployment } : null
      })
      .filter((row): row is { customer: (typeof customers)[0]; deployment: (typeof allDeployments)[0] } => !!row)
  }, [allDeployments, customers])

  const filtered = useMemo(() => {
    return deploymentRows.filter(({ customer, deployment }) => {
      const matchQuery =
        !query ||
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        deployment.dnsSuffix.toLowerCase().includes(query.toLowerCase()) ||
        deployment.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.region.toLowerCase().includes(query.toLowerCase())
      const matchPlan = planFilter === "All" || customer.plan === planFilter
      const matchStatus = statusFilter === "All" || customer.status === statusFilter
      return matchQuery && matchPlan && matchStatus
    })
  }, [query, planFilter, statusFilter, deploymentRows])

  const handleEnterDeployment = (customerId: string, deploymentId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    const deployment = allDeployments.find((d) => d.id === deploymentId && d.customerId === customerId)
    if (!customer || !deployment) return
    setScope({ type: "deployment", customer, deployment })
    router.push("/")
  }

  const onDropDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current += 1
    setDropActive(true)
  }

  const onDropDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current -= 1
    if (dropDepth.current <= 0) {
      dropDepth.current = 0
      setDropActive(false)
    }
  }

  const onDropDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current = 0
    setDropActive(false)
    if (importBusy) return
    const f = firstJsonFileFromDataTransfer(e.dataTransfer)
    if (f) void importJsonFromFile(f)
    else {
      setImportError("Drop a .json file.")
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Customers" subtitle={`${customers.length} customers · ${allDeployments.length} deployments · ${globalStats.activeTenants} active`} />

        <div className="p-8 space-y-6">
          {/* Branded hero */}
          <section
            className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
            style={{ background: "var(--grad-customers)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ctera-curve.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-6 top-5 w-36 opacity-15"
            />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/75">
                <Building2 className="h-3.5 w-3.5" /> Customers
              </div>
              <h2 className="mt-2 text-[27px] font-bold tracking-tight text-white">Customer management</h2>
              <p className="mt-1.5 max-w-xl text-sm text-white/85">
                {customers.length} customers · {allDeployments.length} deployments · {globalStats.activeTenants} active across the platform.
              </p>
            </div>
          </section>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Customers</div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">{customers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active</div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-success">{globalStats.activeTenants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">Total users</span>
                </div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">{globalStats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">Avg adoption</span>
                </div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-primary">{globalStats.averageFeatureAdoption}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Portal deployment</CardTitle>
              <p className="text-[13px] text-muted-foreground font-normal">
                Run the SQL on the Portal database, copy the <code className="text-[12px]">export_json</code> result,
                and import it below. The JSON includes deployment metadata, all feature categories (Infrastructure,
                Services, Tenant Settings, Global Settings), and device list.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyableCollapsibleSnippet
                title="Portal Import JSON"
                content={PORTAL_IMPORT_JSON_SQL}
                language="sql"
                defaultOpen
              />

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="hub-admin-token" className="text-[12px]">
                  Admin token (optional)
                </Label>
                <Input
                  id="hub-admin-token"
                  type="password"
                  placeholder="Only if HUB_ADMIN_TOKEN is set on the server"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  autoComplete="off"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="portal-filter" className="text-[12px]">
                  Portal name override (optional)
                </Label>
                <Input
                  id="portal-filter"
                  placeholder="Defaults to portalDnsSuffix from export"
                  value={portalFilter}
                  onChange={(e) => setPortalFilter(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void importJsonFromFile(f)
                  }}
                />
                <div
                  role="region"
                  aria-label="Drop JSON file"
                  onDragEnter={onDropDragEnter}
                  onDragLeave={onDropDragLeave}
                  onDragOver={onDropDragOver}
                  onDrop={onDrop}
                  className={cn(
                    "rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors max-w-2xl",
                    dropActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:border-muted-foreground/40",
                  )}
                >
                  <Upload
                    className={cn(
                      "mx-auto h-8 w-8 mb-2",
                      dropActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <p className="text-[13px] font-medium text-foreground">Drop JSON here</p>
                  <p className="text-[12px] text-muted-foreground mt-1">or</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 mt-2"
                    disabled={importBusy}
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    Choose JSON file
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-json-paste" className="text-[12px] flex items-center gap-1.5">
                  <FileJson className="h-3.5 w-3.5" />
                  Or paste JSON
                </Label>
                <textarea
                  id="tenant-json-paste"
                  rows={6}
                  value={jsonPaste}
                  onChange={(e) => setJsonPaste(e.target.value)}
                  placeholder="Paste export_json from the Portal SQL query…"
                  className="w-full max-w-2xl rounded-md border border-input bg-transparent px-3 py-2 text-[13px] font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={importBusy || !jsonPaste.trim()}
                  onClick={() => void importJsonFromText(jsonPaste, true)}
                >
                  Apply JSON
                </Button>
              </div>

              {importMessage && <p className="text-sm text-success">{importMessage}</p>}
              {importError && <p className="text-sm text-destructive">{importError}</p>}
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-[15px] font-semibold">All deployments</CardTitle>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Plan filter */}
                  <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                    {plans.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlanFilter(p)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                          planFilter === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                          statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 w-64">
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search customers or deployments..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border bg-muted/40 text-left">
                      <Th>Customer</Th>
                      <Th>Deployment</Th>
                      <Th>DNS suffix</Th>
                      <Th>Plan</Th>
                      <Th className="text-right">Users</Th>
                      <Th className="text-right">Storage</Th>
                      <Th>Feature adoption</Th>
                      <Th>Status</Th>
                      <Th className="w-px"></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(({ customer, deployment }) => {
                      const tier = adoptionTier(customer.featureAdoption ?? 0)
                      return (
                        <tr key={deployment.id} className="group border-b border-border last:border-b-0 transition-colors hover:bg-muted/20">
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-foreground truncate">{customer.name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{customer.region}</div>
                              </div>
                            </div>
                          </Td>
                          <Td className="text-[13px] text-foreground">{deployment.name}</Td>
                          <Td className="text-[13px] text-muted-foreground font-mono text-[12px]">{deployment.dnsSuffix}</Td>
                          <Td>
                            <Badge variant="outline" className="font-normal text-[11px]">{customer.plan}</Badge>
                          </Td>
                          <Td className="text-right text-[13px] tabular-nums">{(customer.users ?? 0).toLocaleString()}</Td>
                          <Td className="text-right text-[13px] tabular-nums">{customer.storage ?? "—"}</Td>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div className={cn("h-full rounded-full", tier.bar)} style={{ width: `${customer.featureAdoption ?? 0}%` }} />
                              </div>
                              <span className="text-[12px] font-semibold tabular-nums w-9" style={{ color: tier.color }}>{customer.featureAdoption ?? 0}%</span>
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-medium", tier.className)}>
                                {tier.label}
                              </span>
                            </div>
                          </Td>
                          <Td>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", statusStyle(deployment.status))}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {deployment.status}
                            </span>
                          </Td>
                          <Td>
                            <button
                              onClick={() => handleEnterDeployment(customer.id, deployment.id)}
                              className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary whitespace-nowrap"
                            >
                              Enter →
                            </button>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No deployments match your filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>
}
