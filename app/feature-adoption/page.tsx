"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { scopeLabel } from "@/lib/hub-scope"
import { effectiveFeatureAdoption } from "@/lib/tenant-hub-views"
import { DeploymentEdgeAdoptionPanel } from "@/components/deployment/deployment-edge-adoption-panel"

const categoryTints: Record<string, string> = {
  Infrastructure: "var(--primary)",
  Services: "#54bff5",
  "Tenant Settings": "var(--warning)",
  "Global Settings": "var(--success)",
}
function tintFor(category: string) {
  return categoryTints[category] ?? "var(--muted-foreground)"
}

export default function FeatureAdoption() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const { prdData, categorySummary } = effectiveFeatureAdoption(hub, scope)
  const [filter, setFilter] = useState<string>("all")

  const totalEnabled = prdData.filter((f) => f.enabled).length
  const totalDisabled = prdData.filter((f) => !f.enabled).length
  const { subtitle: scopeSubtitle } = scopeLabel(scope)
  const scopeDisplay = scope.type === "global" ? "All customers (reference catalog)" : scopeSubtitle

  const filterCards = [
    { key: "all", label: "Total", value: prdData.length, tint: "var(--primary)", sub: "all features" },
    { key: "enabled", label: "Enabled", value: totalEnabled, tint: "var(--success)", sub: "currently on" },
    { key: "disabled", label: "Disabled", value: totalDisabled, tint: "var(--critical)", sub: "currently off" },
    ...categorySummary.map((cat) => ({
      key: `cat:${cat.label}`,
      label: cat.label,
      value: cat.total,
      tint: tintFor(cat.label),
      sub: `${cat.enabled} on · ${cat.disabled} off`,
    })),
  ]

  const filtered = prdData.filter((f) => {
    if (filter === "enabled") return f.enabled
    if (filter === "disabled") return !f.enabled
    if (filter.startsWith("cat:")) return f.category === filter.slice(4)
    return true
  })

  const activeLabel = filterCards.find((c) => c.key === filter)?.label ?? "Total"

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Feature Adoption" subtitle={`Feature status for ${scopeDisplay}`} />
        <div className="space-y-6 p-8">
          {/* Filter cards — click to filter the table below */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
          >
            {filterCards.map((c) => {
              const active = filter === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilter(c.key)}
                  aria-pressed={active}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-transparent ring-2 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                  style={active ? { background: "color-mix(in srgb, var(--primary) 6%, transparent)" } : undefined}
                >
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </p>
                  <div className="mt-1 font-display text-2xl font-bold" style={{ color: c.tint }}>
                    {c.value}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.sub}</p>
                </button>
              )
            })}
          </div>

          {scope.type === "deployment" && <DeploymentEdgeAdoptionPanel />}

          {/* Filtered feature table */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Full Feature List</CardTitle>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length}
                {activeLabel !== "Total" ? ` · ${activeLabel}` : ""} of {prdData.length} features
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[130px] pl-6">Category</TableHead>
                      <TableHead className="w-[180px]">Feature</TableHead>
                      <TableHead className="w-[160px]">Description</TableHead>
                      <TableHead className="min-w-[240px]">Purpose</TableHead>
                      <TableHead className="min-w-[240px]">Deployment Requirement</TableHead>
                      <TableHead className="w-[90px] pr-6 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          No features in this view.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((feature, idx) => {
                        const isNewCategory = idx === 0 || filtered[idx - 1].category !== feature.category
                        const tint = tintFor(feature.category)
                        return (
                          <TableRow key={idx} className={isNewCategory && idx !== 0 ? "border-t-2 border-border" : ""}>
                            <TableCell className="py-3.5 pl-6 align-top">
                              {isNewCategory && (
                                <span
                                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                  style={{
                                    background: `color-mix(in srgb, ${tint} 12%, transparent)`,
                                    color: tint,
                                    border: `1px solid color-mix(in srgb, ${tint} 30%, transparent)`,
                                  }}
                                >
                                  {feature.category}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 align-top text-sm font-medium">{feature.name}</TableCell>
                            <TableCell className="py-3.5 align-top text-sm text-muted-foreground">
                              {feature.description}
                            </TableCell>
                            <TableCell className="py-3.5 align-top text-sm leading-relaxed text-muted-foreground">
                              {feature.purpose}
                            </TableCell>
                            <TableCell className="py-3.5 align-top text-sm leading-relaxed text-muted-foreground">
                              {feature.requirement}
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-center align-top">
                              {feature.enabled ? (
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-medium"
                                  style={{ color: "var(--success)" }}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Enabled
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-medium"
                                  style={{ color: "var(--critical)" }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Disabled
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
