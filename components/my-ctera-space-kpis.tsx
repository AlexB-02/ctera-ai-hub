"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  HardDrive,
  Package,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  computeDeviceFleetKpi,
  computeFeatureAdoptionRate,
  computeLicenseKpi,
  computeStorageKpi,
  computeVersionKpi,
  deviceStatusLabel,
} from "@/lib/my-ctera-space"
import type { SeedHubData } from "@/lib/seed-hub"
import type { Tenant } from "@/lib/hub-schema"
import { cn } from "@/lib/utils"

type LatestVersion = SeedHubData["dashboard"]["latestVersions"][number]

type KpiStat = {
  label: string
  value: string
  tone?: "default" | "warning" | "danger" | "success"
}

type KpiRow = {
  key: string
  primary: string
  secondary?: string
  badge?: string
  badgeClassName?: string
}

type KpiSummary = {
  id: string
  title: string
  icon: ReactNode
  metric: string
  metricHint?: string
  subtitle: string
  href?: string
  linkLabel?: string
  cardClassName?: string
  titleClassName?: string
  badge?: string
  badgeClassName?: string
  progress?: { value: number; label: string; indicatorClassName?: string }
  stats?: KpiStat[]
  rows?: KpiRow[]
}

type Props = {
  lastUpdated: string
  latestVersions: LatestVersion[]
  portalDevices: SeedHubData["portal"]["devices"]
  featureAdoption: SeedHubData["featureAdoption"]
  tenant: Tenant | null
  showLicenseAndStorage: boolean
}

const VISIBLE_COUNT = 3

function versionStatusBadge(status: LatestVersion["status"]) {
  if (status === "up-to-date") {
    return { label: "Current", className: "bg-emerald-100 text-emerald-800" }
  }
  if (status === "update-critical") {
    return { label: "Critical", className: "bg-red-100 text-red-800" }
  }
  return { label: "Update", className: "bg-amber-100 text-amber-800" }
}

function StatGrid({ stats }: { stats: KpiStat[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          <p
            className={cn(
              "truncate text-xs font-semibold",
              stat.tone === "danger" && "text-red-700",
              stat.tone === "warning" && "text-amber-700",
              stat.tone === "success" && "text-emerald-700",
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function RowList({ rows }: { rows: KpiRow[] }) {
  return (
    <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{row.primary}</p>
            {row.secondary && <p className="truncate text-[11px] text-muted-foreground">{row.secondary}</p>}
          </div>
          {row.badge && (
            <Badge
              variant="secondary"
              className={cn("shrink-0 px-1.5 py-0 text-[10px] font-normal", row.badgeClassName)}
            >
              {row.badge}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  )
}

function KpiSummaryCard({ kpi }: { kpi: KpiSummary }) {
  return (
    <Card className={cn("flex min-h-[220px] flex-col", kpi.cardClassName)}>
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background/80">
              {kpi.icon}
            </div>
            <CardTitle className={cn("text-sm font-semibold leading-tight", kpi.titleClassName)}>
              {kpi.title}
            </CardTitle>
          </div>
          {kpi.badge && (
            <Badge className={cn("shrink-0 text-[10px] hover:bg-inherit", kpi.badgeClassName)}>{kpi.badge}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">{kpi.metric}</div>
          {kpi.metricHint && <span className="text-xs text-muted-foreground">{kpi.metricHint}</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</p>

        {kpi.progress && (
          <div className="mt-3 space-y-1">
            <Progress
              value={kpi.progress.value}
              className="h-1.5"
              indicatorClassName={kpi.progress.indicatorClassName}
            />
            <p className="text-[11px] text-muted-foreground">{kpi.progress.label}</p>
          </div>
        )}

        {kpi.rows && kpi.rows.length > 0 && <RowList rows={kpi.rows} />}
        {kpi.stats && kpi.stats.length > 0 && <StatGrid stats={kpi.stats} />}

        {kpi.href && kpi.linkLabel && (
          <Button variant="link" className="mt-auto h-auto justify-start p-0 pt-3 text-xs" asChild>
            <Link href={kpi.href}>
              {kpi.linkLabel}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function MyCteraSpaceKpis({
  lastUpdated,
  latestVersions,
  portalDevices,
  featureAdoption,
  tenant,
  showLicenseAndStorage,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const deviceFleet = useMemo(() => computeDeviceFleetKpi(portalDevices), [portalDevices])
  const adoption = useMemo(
    () => computeFeatureAdoptionRate(featureAdoption, tenant),
    [featureAdoption, tenant],
  )
  const versions = useMemo(() => computeVersionKpi(latestVersions), [latestVersions])
  const storage = useMemo(() => computeStorageKpi(tenant), [tenant])
  const license = useMemo(() => computeLicenseKpi(tenant), [tenant])

  const kpiSummaries = useMemo((): KpiSummary[] => {
    const items: KpiSummary[] = [
      {
        id: "versions",
        title: "Installed Versions",
        icon: <Package className="h-4 w-4 text-muted-foreground" />,
        metric: versions.total === 0 ? "—" : `${versions.upToDate}/${versions.total}`,
        metricHint: versions.total > 0 ? "up to date" : undefined,
        subtitle:
          versions.total === 0
            ? "No version data available"
            : versions.updateCritical > 0
              ? `${versions.updateCritical} critical · ${versions.updateRequired} pending updates`
              : versions.updateRequired > 0
                ? `${versions.updateRequired} product${versions.updateRequired === 1 ? "" : "s"} pending update`
                : "All installed products are current",
        progress:
          versions.total > 0
            ? {
                value: versions.upToDateRate,
                label: `${versions.upToDateRate}% of products on latest release`,
                indicatorClassName:
                  versions.updateCritical > 0
                    ? "bg-red-500"
                    : versions.updateRequired > 0
                      ? "bg-amber-500"
                      : "bg-emerald-500",
              }
            : undefined,
        rows:
          versions.products.length > 0
            ? versions.products.map((product) => {
                const badge = versionStatusBadge(product.status)
                return {
                  key: `${product.name}-${product.version}`,
                  primary: product.name,
                  secondary: `v${product.version}`,
                  badge: badge.label,
                  badgeClassName: badge.className,
                }
              })
            : undefined,
        stats:
          versions.total > 0
            ? [
                { label: "Current", value: String(versions.upToDate), tone: "success" as const },
                { label: "Pending", value: String(versions.updateRequired), tone: "warning" as const },
                { label: "Critical", value: String(versions.updateCritical), tone: "danger" as const },
              ]
            : undefined,
        href: "/downloads",
        linkLabel: "View downloads",
      },
    ]

    if (showLicenseAndStorage) {
      items.push(
        {
          id: "license",
          title: "License",
          icon: <Clock className="h-4 w-4 text-orange-600" />,
          metric: `${license.daysRemaining} days`,
          metricHint: "remaining",
          subtitle: `${license.plan} plan · expires ${license.expiryLabel}`,
          badge: license.status === "trial" ? "Trial" : license.status === "suspended" ? "Suspended" : "Active",
          badgeClassName:
            license.status === "trial"
              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
              : license.status === "suspended"
                ? "bg-red-100 text-red-800 hover:bg-red-100"
                : "bg-orange-100 text-orange-800 hover:bg-orange-100",
          progress: {
            value: license.renewalProgress,
            label: `${license.renewalProgress}% through current license term`,
            indicatorClassName: license.daysRemaining < 60 ? "bg-amber-500" : "bg-orange-500",
          },
          stats: [
            { label: "Plan", value: license.plan },
            {
              label: "Users",
              value: license.users !== null ? license.users.toLocaleString() : "—",
            },
            { label: "Region", value: tenant?.region ?? "—" },
          ],
          cardClassName: "border-orange-200/80 bg-orange-50/40",
          titleClassName: "text-orange-950",
        },
        {
          id: "storage",
          title: "Storage",
          icon: <Database className="h-4 w-4 text-red-600" />,
          metric: `${storage.usedPercent}%`,
          metricHint: "used",
          subtitle: `${storage.usedLabel} of ${storage.limitLabel} allocated · ${storage.remainingLabel}`,
          badge: storage.usedPercent >= 90 ? "Near limit" : storage.usedPercent >= 75 ? "Monitor" : "Healthy",
          badgeClassName:
            storage.usedPercent >= 90
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : storage.usedPercent >= 75
                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
          progress: {
            value: storage.usedPercent,
            label:
              storage.usedPercent >= 90
                ? "Consider expanding capacity soon"
                : `${storage.remainingLabel} remaining in quota`,
            indicatorClassName:
              storage.usedPercent >= 90 ? "bg-red-500" : storage.usedPercent >= 75 ? "bg-amber-500" : "bg-emerald-500",
          },
          stats: [
            { label: "Used", value: storage.usedLabel },
            { label: "Quota", value: storage.limitLabel },
            { label: "Free", value: storage.remainingLabel.split(" ")[0] ?? "—", tone: "success" },
          ],
          cardClassName: "border-red-200/80 bg-red-50/40",
          titleClassName: "text-red-950",
        },
      )
    }

    items.push(
      {
        id: "device-fleet",
        title: "Device Fleet",
        icon: <HardDrive className="h-4 w-4 text-blue-600" />,
        metric: deviceFleet.total === 0 ? "—" : String(deviceFleet.total),
        metricHint: deviceFleet.total > 0 ? "devices" : undefined,
        subtitle:
          deviceFleet.total === 0
            ? "No deployment devices registered"
            : `${deviceFleet.edgeFilers} edge filers · ${deviceFleet.driveDevices} drive endpoints · ${deviceFleet.uniqueRegions} region${deviceFleet.uniqueRegions === 1 ? "" : "s"}`,
        progress:
          deviceFleet.total > 0
            ? {
                value: deviceFleet.healthRate,
                label: `${deviceFleet.healthyCount} of ${deviceFleet.total} devices healthy (${deviceFleet.healthRate}%)`,
                indicatorClassName: deviceFleet.criticalCount > 0 ? "bg-amber-500" : "bg-blue-500",
              }
            : undefined,
        rows:
          deviceFleet.topDevices.length > 0
            ? deviceFleet.topDevices.map((device) => {
                const isCritical = device.status === "update-critical"
                const isPending = device.status === "update-required"
                return {
                  key: String(device.id),
                  primary: device.name,
                  secondary: `${device.type} · ${device.location}`,
                  badge: deviceStatusLabel(device.status),
                  badgeClassName: isCritical
                    ? "bg-red-100 text-red-800"
                    : isPending
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800",
                }
              })
            : undefined,
        stats:
          deviceFleet.total > 0
            ? [
                { label: "Edge", value: String(deviceFleet.edgeFilers) },
                {
                  label: "Critical",
                  value: String(deviceFleet.criticalCount),
                  tone: deviceFleet.criticalCount > 0 ? ("danger" as const) : ("default" as const),
                },
                { label: "Regions", value: String(deviceFleet.uniqueRegions) },
              ]
            : undefined,
        href: "/portal",
        linkLabel:
          deviceFleet.remainingCount > 0 ? `+${deviceFleet.remainingCount} more in Deployment` : "Open Deployment",
        cardClassName: "border-blue-200/80 bg-blue-50/40",
        titleClassName: "text-blue-950",
      },
      {
        id: "feature-adoption",
        title: "Feature Adoption",
        icon: <TrendingUp className="h-4 w-4 text-primary" />,
        metric: `${adoption.rate}%`,
        metricHint: "adopted",
        subtitle:
          adoption.total > 0
            ? `${adoption.enabled} enabled · ${adoption.disabled} disabled across ${adoption.total} PRD features`
            : tenant
              ? `${tenant.name} portal adoption score`
              : "Adoption across configured portal features",
        progress: {
          value: adoption.rate,
          label:
            adoption.categories.length > 0
              ? `${adoption.fullyAdoptedCategories} of ${adoption.categories.length} categories fully enabled`
              : `${adoption.rate}% of tracked features enabled`,
          indicatorClassName: adoption.rate >= 80 ? "bg-emerald-500" : adoption.rate >= 60 ? "bg-primary" : "bg-amber-500",
        },
        rows:
          adoption.categories.length > 0
            ? adoption.categories.map((category) => ({
                key: category.label,
                primary: category.label,
                secondary: `${category.enabled} of ${category.total} features`,
                badge: category.enabled === category.total ? "Complete" : `${category.total - category.enabled} gap`,
                badgeClassName:
                  category.enabled === category.total
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-muted text-muted-foreground",
              }))
            : undefined,
        stats:
          adoption.total > 0
            ? [
                { label: "Enabled", value: String(adoption.enabled), tone: "success" as const },
                { label: "Disabled", value: String(adoption.disabled), tone: "warning" as const },
                {
                  label: "Categories",
                  value: `${adoption.fullyAdoptedCategories}/${adoption.categories.length || "—"}`,
                },
              ]
            : tenant
              ? [
                  { label: "Score", value: `${tenant.featureAdoption}%` },
                  { label: "Plan", value: tenant.plan },
                  { label: "Users", value: tenant.users.toLocaleString() },
                ]
              : undefined,
        href: "/feature-adoption",
        linkLabel: "Explore features",
        cardClassName: "border-primary/20 bg-primary/5",
      },
    )

    return items
  }, [
    adoption.categories,
    adoption.disabled,
    adoption.enabled,
    adoption.fullyAdoptedCategories,
    adoption.rate,
    adoption.total,
    deviceFleet.criticalCount,
    deviceFleet.driveDevices,
    deviceFleet.edgeFilers,
    deviceFleet.healthRate,
    deviceFleet.healthyCount,
    deviceFleet.remainingCount,
    deviceFleet.topDevices,
    deviceFleet.total,
    deviceFleet.uniqueRegions,
    license.daysRemaining,
    license.expiryLabel,
    license.plan,
    license.renewalProgress,
    license.status,
    license.users,
    showLicenseAndStorage,
    storage.limitLabel,
    storage.remainingLabel,
    storage.usedLabel,
    storage.usedPercent,
    tenant,
    versions.products,
    versions.total,
    versions.upToDate,
    versions.upToDateRate,
    versions.updateCritical,
    versions.updateRequired,
  ])

  useEffect(() => {
    setCurrentIndex((i) => (kpiSummaries.length === 0 ? 0 : Math.min(i, kpiSummaries.length - 1)))
  }, [kpiSummaries.length])

  const goPrev = () => setCurrentIndex((i) => (i === 0 ? kpiSummaries.length - 1 : i - 1))
  const goNext = () => setCurrentIndex((i) => (i === kpiSummaries.length - 1 ? 0 : i + 1))

  if (kpiSummaries.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">My CTERA Space</CardTitle>
          <span className="text-sm text-muted-foreground">Last Updated: {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="overflow-hidden rounded-lg">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: Math.min(VISIBLE_COUNT, kpiSummaries.length) }).map((_, offset) => {
                const kpi = kpiSummaries[(currentIndex + offset) % kpiSummaries.length]
                return <KpiSummaryCard key={`${kpi.id}-${offset}`} kpi={kpi} />
              })}
            </div>
          </div>

          {kpiSummaries.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goPrev}
                className="h-8 w-8 bg-transparent"
                aria-label="Previous KPIs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {kpiSummaries.map((kpi, index) => (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      index === currentIndex ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                    aria-label={`Show KPIs starting at ${kpi.title}`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={goNext}
                className="h-8 w-8 bg-transparent"
                aria-label="Next KPIs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
