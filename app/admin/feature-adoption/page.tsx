"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useHub } from "@/components/hub-provider"
import { Search } from "lucide-react"

// All features across all categories with per-tenant adoption simulation
type Feature = {
  id: string
  name: string
  description: string
  category: string
  // adoption % = fraction of tenants that have this feature enabled
  adoption: number
}

// Simulate per-feature adoption across tenants deterministically
function computeAdoption(featureIndex: number, totalTenants: number): number {
  // Use a deterministic spread so different features show different adoption rates
  const rates = [100, 92, 83, 75, 67, 58, 50, 42, 100, 83, 67, 92, 58, 75, 83, 58, 42, 75, 83, 67, 100, 83, 58, 75, 92, 67, 83, 58, 75, 92, 67, 83, 100, 58, 75, 83, 92]
  return rates[featureIndex % rates.length]
}

const rawFeatures = {
  Infrastructure: [
    { name: "Application Server", description: "Application hosting services" },
    { name: "Database Server", description: "Data storage systems" },
    { name: "Database Replication Server", description: "Data redundancy and replication" },
    { name: "Preview Server", description: "Preview and staging environments" },
    { name: "DB Archiving", description: "Data archival systems" },
    { name: "DB Replication", description: "Data redundancy" },
    { name: "Backup to Bucket", description: "Cloud backup solutions" },
  ],
  Services: [
    { name: "Syslog", description: "System event logging" },
    { name: "Edge Filer Syslog", description: "Edge-specific logging" },
    { name: "KMS", description: "Key Management" },
    { name: "Veeonis", description: "Data Security" },
    { name: "SMTP", description: "Email delivery service" },
    { name: "SMS", description: "Text messaging gateway" },
    { name: "Backup Service", description: "Automated backup" },
    { name: "Sync Service", description: "File synchronization" },
    { name: "Audit Service", description: "Activity logging" },
  ],
  "Tenant Settings": [
    { name: "Active Directory (AD)", description: "Domain integration" },
    { name: "Access Based Presentation (ABP)", description: "Permission-based visibility" },
    { name: "Single Sign On (SSO)", description: "Unified authentication" },
    { name: "Super Tenant Users", description: "Superuser accounts" },
    { name: "Skins", description: "Custom themes" },
    { name: "Configuration Templates", description: "Setup templates" },
    { name: "Button Generator", description: "Brand color schemes" },
    { name: "Email Templates", description: "Notification customization" },
    { name: "Teams Integration", description: "Microsoft Teams connectivity" },
    { name: "Global File Lock (GFL)", description: "Concurrent access control" },
    { name: "Office Online", description: "Web-based editing" },
    { name: "Cloud Drive Policy", description: "Access permissions" },
    { name: "Zones Enabled", description: "Multi-zone deployment" },
  ],
  "Global Settings": [
    { name: "iFrame Enabled", description: "Web embedding capability" },
    { name: "Global AD", description: "Active Directory integration" },
    { name: "Global Admin SSO", description: "Single sign on for admins" },
    { name: "Global Admin Access Control", description: "Role-based permissions" },
    { name: "Firmware Repository", description: "Internal update management" },
    { name: "Skins", description: "UI customization themes" },
    { name: "Roles - Super User", description: "Administrative privileges" },
    { name: "Custom Log Based Alerts", description: "Monitoring notifications" },
  ],
}

const categories = ["All", ...Object.keys(rawFeatures)]

function adoptionColor(pct: number) {
  if (pct >= 80) return { bar: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" }
  if (pct >= 60) return { bar: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-50 border-blue-200 text-blue-700" }
  if (pct >= 40) return { bar: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-50 border-amber-200 text-amber-700" }
  return { bar: "bg-red-500", text: "text-red-700", badge: "bg-red-50 border-red-200 text-red-700" }
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function AdminFeatureAdoptionPage() {
  const { hub } = useHub()
  const tenants = hub.tenants

  const features = useMemo(() => {
    let idx = 0
    return Object.entries(rawFeatures).flatMap(([category, items]) =>
      items.map((item) => ({
        id: `${category}-${idx}`,
        name: item.name,
        description: item.description,
        category,
        adoption: computeAdoption(idx++, tenants.length),
      })),
    )
  }, [tenants.length])

  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const matchQuery =
        !query ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.description.toLowerCase().includes(query.toLowerCase())
      const matchCat = selectedCategory === "All" || f.category === selectedCategory
      return matchQuery && matchCat
    })
  }, [query, selectedCategory, features])

  const overallAdoption = Math.round(features.reduce((s, f) => s + f.adoption, 0) / features.length)
  const highCount = features.filter((f) => f.adoption >= 80).length
  const medCount = features.filter((f) => f.adoption >= 60 && f.adoption < 80).length
  const lowCount = features.filter((f) => f.adoption < 60).length

  // Group filtered by category
  const grouped = useMemo(() => {
    if (selectedCategory !== "All") {
      return { [selectedCategory]: filtered }
    }
    return filtered.reduce<Record<string, Feature[]>>((acc, f) => {
      if (!acc[f.category]) acc[f.category] = []
      acc[f.category].push(f)
      return acc
    }, {})
  }, [filtered, selectedCategory])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Feature Adoption" subtitle={`Global view across ${tenants.length} tenants`} />

        <div className="p-8 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="col-span-1">
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Overall adoption</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{overallAdoption}</span>
                  <span className="text-xl font-medium text-muted-foreground">%</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${overallAdoption}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total features</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{features.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">High adoption</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-emerald-600">{highCount}</div>
                <div className="text-[11px] text-muted-foreground mt-1">above 80%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Needs attention</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-amber-600">{lowCount}</div>
                <div className="text-[11px] text-muted-foreground mt-1">below 60%</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded px-3 py-1.5 text-[12px] font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 w-64 ml-auto">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Feature groups */}
          {Object.entries(grouped).map(([category, items]) => {
            const catAdoption = Math.round(items.reduce((s, f) => s + f.adoption, 0) / items.length)
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold">{category}</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground">{items.length} features</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", adoptionColor(catAdoption).bar)}
                            style={{ width: `${catAdoption}%` }}
                          />
                        </div>
                        <span className={cn("text-[13px] font-semibold tabular-nums", adoptionColor(catAdoption).text)}>
                          {catAdoption}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-border bg-muted/40 text-left">
                        <Th>Feature</Th>
                        <Th>Description</Th>
                        <Th className="w-56">Adoption across tenants</Th>
                        <Th className="w-px text-right">Rate</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((feature) => {
                        const color = adoptionColor(feature.adoption)
                        return (
                          <tr key={feature.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                            <Td>
                              <span className="text-[13px] font-medium text-foreground">{feature.name}</span>
                            </Td>
                            <Td>
                              <span className="text-[13px] text-muted-foreground">{feature.description}</span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-2.5">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn("h-full rounded-full transition-all", color.bar)}
                                    style={{ width: `${feature.adoption}%` }}
                                  />
                                </div>
                                <span className={cn("w-6 text-right text-[11px] font-medium tabular-nums", color.text)}>
                                  {Math.round(feature.adoption * tenants.length / 100)}/{tenants.length}
                                </span>
                              </div>
                            </Td>
                            <Td className="text-right">
                              <span
                                className={cn(
                                  "inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                                  color.badge,
                                )}
                              >
                                {feature.adoption}%
                              </span>
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No features match &quot;{query}&quot;
            </div>
          )}
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
