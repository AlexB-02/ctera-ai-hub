"use client"

import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, TrendingUp, Globe, Download, CheckSquare, ArrowRight } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { cn } from "@/lib/utils"
import type { Tenant } from "@/lib/hub-schema"

const adoptionTier = (pct: number) => {
  if (pct >= 80) return { label: "High", className: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" }
  if (pct >= 60) return { label: "Medium", className: "text-blue-700 bg-blue-50 border-blue-200", bar: "bg-blue-500" }
  if (pct >= 40) return { label: "Low", className: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-500" }
  return { label: "Very Low", className: "text-red-700 bg-red-50 border-red-200", bar: "bg-red-500" }
}

export default function AdminGlobalPage() {
  const { hub } = useHub()
  const { tenants, globalStats } = hub

  const quickLinks = [
    {
      href: "/admin/tenants",
      icon: Building2,
      label: "Tenants",
      description: "Manage & enter tenant environments",
      stat: `${globalStats.activeTenants} active`,
    },
    {
      href: "/admin/downloads",
      icon: Download,
      label: "Downloads Center",
      description: "Add, remove and publish files",
      stat: "10 files",
    },
    {
      href: "/admin/feature-adoption",
      icon: CheckSquare,
      label: "Feature Adoption",
      description: "Global per-feature adoption rates",
      stat: `${globalStats.averageFeatureAdoption}% avg`,
    },
  ]

  const topTenants = [...tenants].sort((a, b) => b.featureAdoption - a.featureAdoption).slice(0, 5)
  const bottomTenants = [...tenants].sort((a, b) => a.featureAdoption - b.featureAdoption).slice(0, 5)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Global View" subtitle="Platform-wide overview" />

        <div className="p-8 space-y-6">
          {/* Hero KPI */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-1 border-foreground/10 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Global feature adoption</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight tabular-nums">{globalStats.averageFeatureAdoption}</span>
                  <span className="text-2xl font-medium text-muted-foreground">%</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">Avg across {globalStats.totalTenants} tenants</p>
                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${globalStats.averageFeatureAdoption}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  +4.2% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Active tenants</span>
                </div>
                <div className="text-5xl font-semibold tracking-tight tabular-nums">{globalStats.activeTenants}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">of {globalStats.totalTenants} total</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((globalStats.activeTenants / globalStats.totalTenants) * 100)}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Total users</span>
                </div>
                <div className="text-5xl font-semibold tracking-tight tabular-nums">{globalStats.totalUsers.toLocaleString()}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">across all tenants</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-foreground/20">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                        <link.icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-3">
                      <div className="text-[14px] font-semibold text-foreground">{link.label}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{link.description}</div>
                    </div>
                    <div className="mt-3 text-[11px] font-medium text-muted-foreground border-t border-border pt-3">{link.stat}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Adoption distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Adoption distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-4">
                {[
                  { label: "High (80–100%)", count: tenants.filter((t) => t.featureAdoption >= 80).length, color: "bg-emerald-500" },
                  { label: "Medium (60–79%)", count: tenants.filter((t) => t.featureAdoption >= 60 && t.featureAdoption < 80).length, color: "bg-blue-500" },
                  { label: "Low (40–59%)", count: tenants.filter((t) => t.featureAdoption >= 40 && t.featureAdoption < 60).length, color: "bg-amber-500" },
                  { label: "Very low (<40%)", count: tenants.filter((t) => t.featureAdoption < 40).length, color: "bg-red-500" },
                ].map((tier) => (
                  <div key={tier.label} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("h-2 w-2 rounded-full", tier.color)} />
                      <span className="text-[11px] font-medium text-muted-foreground">{tier.label}</span>
                    </div>
                    <div className="text-2xl font-semibold tracking-tight tabular-nums">{tier.count}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {Math.round((tier.count / globalStats.totalTenants) * 100)}% of tenants
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top & bottom tenants side by side */}
          <div className="grid grid-cols-2 gap-4">
            <TenantRankCard title="Top adopters" tenants={topTenants} />
            <TenantRankCard title="Need attention" tenants={bottomTenants} reverse />
          </div>
        </div>
      </main>
    </div>
  )
}

function TenantRankCard({
  title,
  tenants: list,
  reverse,
}: {
  title: string
  tenants: Tenant[]
  reverse?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
          <Link href="/admin/tenants" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {list.map((t) => {
          const tier = adoptionTier(t.featureAdoption)
          return (
            <div key={t.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{t.region}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", tier.bar)} style={{ width: `${t.featureAdoption}%` }} />
                </div>
                <span className={cn("text-[12px] font-semibold tabular-nums w-9 text-right", reverse ? "text-amber-600" : "text-emerald-600")}>
                  {t.featureAdoption}%
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
