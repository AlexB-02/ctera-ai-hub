"use client"

import { useState, useMemo, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Search, Users, HardDrive, Upload, FileJson, ClipboardList } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { cn } from "@/lib/utils"
import { isFeatureInventoryArray } from "@/lib/feature-inventory-guards"
import { useRouter } from "next/navigation"

const adoptionTier = (pct: number) => {
  if (pct >= 80) return { label: "High", className: "text-emerald-700 bg-emerald-50 border-emerald-200" }
  if (pct >= 60) return { label: "Medium", className: "text-blue-700 bg-blue-50 border-blue-200" }
  if (pct >= 40) return { label: "Low", className: "text-amber-700 bg-amber-50 border-amber-200" }
  return { label: "Very Low", className: "text-red-700 bg-red-50 border-red-200" }
}

const statusStyle = (status: string) => {
  switch (status) {
    case "active": return "text-emerald-700 bg-emerald-50 border-emerald-200"
    case "trial": return "text-blue-700 bg-blue-50 border-blue-200"
    case "suspended": return "text-red-700 bg-red-50 border-red-200"
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

  const fileRef = useRef<HTMLInputElement>(null)
  const [tenantJsonPaste, setTenantJsonPaste] = useState("")
  const [adminToken, setAdminToken] = useState("")
  const [tenantImportBusy, setTenantImportBusy] = useState(false)
  const [tenantImportMessage, setTenantImportMessage] = useState<string | null>(null)
  const [tenantImportError, setTenantImportError] = useState<string | null>(null)

  const inventoryFileRef = useRef<HTMLInputElement>(null)
  const [inventoryPortalFilter, setInventoryPortalFilter] = useState("")
  const [inventoryBusy, setInventoryBusy] = useState(false)
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  const tenantDropDepth = useRef(0)
  const [tenantDropActive, setTenantDropActive] = useState(false)
  const inventoryDropDepth = useRef(0)
  const [inventoryDropActive, setInventoryDropActive] = useState(false)

  const authHeaders = (): HeadersInit => {
    const t = adminToken.trim()
    if (!t) return {}
    return { Authorization: `Bearer ${t}` }
  }

  const importFeatureInventory = async (file: File) => {
    setInventoryMessage(null)
    setInventoryError(null)
    setInventoryBusy(true)
    try {
      const fd = new FormData()
      fd.set("file", file)
      const q = inventoryPortalFilter.trim()
      const url = q
        ? `/api/hub-data/tenant/from-features?portal=${encodeURIComponent(q)}`
        : "/api/hub-data/tenant/from-features"
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
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
        setInventoryError(msg)
        return
      }
      const list = data.imported ?? []
      const names = list.map((i) => i.tenant?.name ?? i.tenant?.id ?? "—").join(", ")
      setInventoryMessage(list.length ? `Imported ${list.length} tenant(s): ${names}` : "Done")
      await reload()
    } catch {
      setInventoryError("Upload failed")
    } finally {
      setInventoryBusy(false)
      if (inventoryFileRef.current) inventoryFileRef.current.value = ""
    }
  }

  const importTenantFromFile = async (file: File) => {
    setTenantImportMessage(null)
    setTenantImportError(null)
    const rawText = await file.text()
    const normalized = rawText.replace(/^\uFEFF/, "").trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(normalized)
    } catch {
      setTenantImportError("File is not valid JSON.")
      return
    }
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)
        ? (parsed as { rows: unknown[] }).rows
        : null
    if (rows && isFeatureInventoryArray(rows)) {
      const forwarded = new File([normalized], file.name, { type: "application/json" })
      await importFeatureInventory(forwarded)
      return
    }

    setTenantImportBusy(true)
    try {
      const fd = new FormData()
      fd.set("file", new File([normalized], file.name, { type: "application/json" }))
      const res = await fetch("/api/hub-data/tenant/upload", {
        method: "POST",
        headers: authHeaders(),
        body: fd,
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
        setTenantImportError(msg)
        return
      }
      setTenantImportMessage(
        data.mode === "updated"
          ? `Updated tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`
          : `Added tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`,
      )
      await reload()
    } catch {
      setTenantImportError("Upload failed")
    } finally {
      setTenantImportBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const importTenantFromPaste = async () => {
    setTenantImportMessage(null)
    setTenantImportError(null)
    let body: unknown
    try {
      body = JSON.parse(tenantJsonPaste.trim())
    } catch {
      setTenantImportError("Paste valid JSON (one tenant object, or { \"tenant\": { ... } }).")
      return
    }
    setTenantImportBusy(true)
    try {
      const res = await fetch("/api/hub-data/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; mode?: string; tenant?: { name?: string; id?: string } }
      if (!res.ok) {
        setTenantImportError(typeof data.error === "string" ? data.error : res.statusText)
        return
      }
      setTenantImportMessage(
        data.mode === "updated"
          ? `Updated tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`
          : `Added tenant “${data.tenant?.name ?? data.tenant?.id ?? "—"}”.`,
      )
      setTenantJsonPaste("")
      await reload()
    } catch {
      setTenantImportError("Request failed")
    } finally {
      setTenantImportBusy(false)
    }
  }

  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const { setScope } = useTenant()
  const router = useRouter()

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const matchQuery =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.domain.toLowerCase().includes(query.toLowerCase()) ||
        t.region.toLowerCase().includes(query.toLowerCase())
      const matchPlan = planFilter === "All" || t.plan === planFilter
      const matchStatus = statusFilter === "All" || t.status === statusFilter
      return matchQuery && matchPlan && matchStatus
    })
  }, [query, planFilter, statusFilter, tenants])

  const handleEnterTenant = (id: string) => {
    const tenant = tenants.find((t) => t.id === id)
    if (!tenant) return
    setScope({ type: "tenant", tenant })
    router.push("/")
  }

  const onTenantDropDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tenantDropDepth.current += 1
    setTenantDropActive(true)
  }

  const onTenantDropDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tenantDropDepth.current -= 1
    if (tenantDropDepth.current <= 0) {
      tenantDropDepth.current = 0
      setTenantDropActive(false)
    }
  }

  const onTenantDropDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }

  const onTenantDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tenantDropDepth.current = 0
    setTenantDropActive(false)
    if (tenantImportBusy) return
    const f = firstJsonFileFromDataTransfer(e.dataTransfer)
    if (f) void importTenantFromFile(f)
    else {
      setTenantImportError("Drop a .json file.")
    }
  }

  const onInventoryDropDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    inventoryDropDepth.current += 1
    setInventoryDropActive(true)
  }

  const onInventoryDropDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    inventoryDropDepth.current -= 1
    if (inventoryDropDepth.current <= 0) {
      inventoryDropDepth.current = 0
      setInventoryDropActive(false)
    }
  }

  const onInventoryDropDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }

  const onInventoryDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    inventoryDropDepth.current = 0
    setInventoryDropActive(false)
    if (inventoryBusy) return
    const f = firstJsonFileFromDataTransfer(e.dataTransfer)
    if (f) void importFeatureInventory(f)
    else {
      setInventoryError("Drop a .json file.")
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Tenants" subtitle={`${globalStats.totalTenants} tenants · ${globalStats.activeTenants} active`} />

        <div className="p-8 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total tenants</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{globalStats.totalTenants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-emerald-600">{globalStats.activeTenants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Total users</span>
                </div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{globalStats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Avg adoption</span>
                </div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{globalStats.averageFeatureAdoption}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Import tenant from JSON</CardTitle>
              <p className="text-[13px] text-muted-foreground font-normal">
                Drag and drop a <code className="text-[12px]">.json</code> file, choose a file, or paste JSON for one tenant object (same fields as the table). If{" "}
                <code className="text-[12px]">id</code> already exists, the row is replaced; otherwise it is appended.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void importTenantFromFile(f)
                  }}
                />
                <div
                  role="region"
                  aria-label="Drop tenant JSON file"
                  onDragEnter={onTenantDropDragEnter}
                  onDragLeave={onTenantDropDragLeave}
                  onDragOver={onTenantDropDragOver}
                  onDrop={onTenantDrop}
                  className={cn(
                    "rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors max-w-2xl",
                    tenantDropActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:border-muted-foreground/40",
                  )}
                >
                  <Upload
                    className={cn(
                      "mx-auto h-8 w-8 mb-2",
                      tenantDropActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <p className="text-[13px] font-medium text-foreground">Drop tenant JSON here</p>
                  <p className="text-[12px] text-muted-foreground mt-1">or</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 mt-2"
                    disabled={tenantImportBusy}
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
                  value={tenantJsonPaste}
                  onChange={(e) => setTenantJsonPaste(e.target.value)}
                  placeholder={`{\n  "id": "acme",\n  "name": "Acme Corp",\n  "domain": "acme.example",\n  ...\n}`}
                  className="w-full max-w-2xl rounded-md border border-input bg-transparent px-3 py-2 text-[13px] font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="button" size="sm" disabled={tenantImportBusy || !tenantJsonPaste.trim()} onClick={() => void importTenantFromPaste()}>
                  Apply JSON
                </Button>
              </div>
              {tenantImportMessage && <p className="text-sm text-emerald-600 dark:text-emerald-400">{tenantImportMessage}</p>}
              {tenantImportError && <p className="text-sm text-destructive">{tenantImportError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Import from feature inventory JSON</CardTitle>
              <p className="text-[13px] text-muted-foreground font-normal">
                Array export like <code className="text-[12px]">features_clean.json</code>: each row has{" "}
                <code className="text-[12px]">portal_name</code>, <code className="text-[12px]">feature</code>,{" "}
                <code className="text-[12px]">status</code> (ON/OFF). <strong>Portal name becomes the tenant name.</strong>{" "}
                Feature adoption % is the share of ON rows for that portal. Unquoted values such as{" "}
                <code className="text-[12px]">ctera.me</code> after <code className="text-[12px]">portal_name</code> are fixed automatically.
                Leave “Portal filter” empty to import every distinct <code className="text-[12px]">portal_name</code> in the file. Drag and drop your JSON onto the zone below or use the button.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 max-w-xl">
                <div className="space-y-1.5 flex-1 min-w-[12rem]">
                  <Label htmlFor="inventory-portal-filter" className="text-[12px]">
                    Portal filter (optional)
                  </Label>
                  <Input
                    id="inventory-portal-filter"
                    placeholder="e.g. demo — leave empty for all"
                    value={inventoryPortalFilter}
                    onChange={(e) => setInventoryPortalFilter(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <input
                ref={inventoryFileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void importFeatureInventory(f)
                }}
              />
              <div
                role="region"
                aria-label="Drop feature inventory JSON file"
                onDragEnter={onInventoryDropDragEnter}
                onDragLeave={onInventoryDropDragLeave}
                onDragOver={onInventoryDropDragOver}
                onDrop={onInventoryDrop}
                className={cn(
                  "rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors max-w-2xl",
                  inventoryDropActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-muted-foreground/40",
                )}
              >
                <ClipboardList
                  className={cn(
                    "mx-auto h-8 w-8 mb-2",
                    inventoryDropActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <p className="text-[13px] font-medium text-foreground">Drop features JSON here</p>
                <p className="text-[12px] text-muted-foreground mt-1">or</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-2"
                  disabled={inventoryBusy}
                  onClick={() => inventoryFileRef.current?.click()}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Choose features JSON
                </Button>
              </div>
              {inventoryMessage && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{inventoryMessage}</p>
              )}
              {inventoryError && <p className="text-sm text-destructive">{inventoryError}</p>}
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-[15px] font-semibold">All tenants</CardTitle>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Plan filter */}
                  <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                    {plans.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlanFilter(p)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                          planFilter === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
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
                          statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
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
                      placeholder="Search tenants..."
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
                      <Th>Tenant</Th>
                      <Th>Region</Th>
                      <Th>Plan</Th>
                      <Th className="text-right">Users</Th>
                      <Th className="text-right">Storage</Th>
                      <Th>Feature adoption</Th>
                      <Th>Status</Th>
                      <Th className="w-px"></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const tier = adoptionTier(t.featureAdoption)
                      return (
                        <tr key={t.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20">
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-foreground truncate">{t.name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{t.domain}</div>
                              </div>
                            </div>
                          </Td>
                          <Td className="text-[13px] text-muted-foreground">{t.region}</Td>
                          <Td>
                            <Badge variant="outline" className="font-normal text-[11px]">{t.plan}</Badge>
                          </Td>
                          <Td className="text-right text-[13px] tabular-nums">{t.users.toLocaleString()}</Td>
                          <Td className="text-right text-[13px] tabular-nums">{t.storage}</Td>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-foreground" style={{ width: `${t.featureAdoption}%` }} />
                              </div>
                              <span className="text-[12px] tabular-nums text-foreground w-9">{t.featureAdoption}%</span>
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-medium", tier.className)}>
                                {tier.label}
                              </span>
                            </div>
                          </Td>
                          <Td>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", statusStyle(t.status))}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {t.status}
                            </span>
                          </Td>
                          <Td>
                            <button
                              onClick={() => handleEnterTenant(t.id)}
                              className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted whitespace-nowrap"
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
                    No tenants match your filters
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
