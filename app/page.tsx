"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Database,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  Download,
  Server,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { effectiveDashboard, effectiveFeatureAdoption, tenantUsesFeaturesOnlyViews } from "@/lib/tenant-hub-views"
import { getDashboardNewsIcon, getDashboardVersionIcon, getDeviceIcon } from "@/lib/lucide-icon-map"
import { seedHubData } from "@/lib/seed-hub"

export default function DashboardPage() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const dashboard = effectiveDashboard(hub, scope)
  const { newsItems, latestVersions, latestNewsItems, myCteraSpaceLastUpdated } = dashboard
  const latestNewsForDisplay = useMemo(() => {
    if (latestNewsItems.length > 0) return latestNewsItems
    const fromHub = hub.dashboard.latestNewsItems ?? []
    if (fromHub.length > 0) return fromHub
    return seedHubData.dashboard.latestNewsItems
  }, [latestNewsItems, hub.dashboard.latestNewsItems])

  const isFeaturesOnlyTenant = scope.type === "tenant" && tenantUsesFeaturesOnlyViews(scope.tenant)

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [currentLatestNewsIndex, setCurrentLatestNewsIndex] = useState(0)
  const [deviceKpiIndex, setDeviceKpiIndex] = useState(0)

  // Devices sorted alphabetically for the Device Fleet KPI card
  const fleetDevices = [...(hub.devices?.devices ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  const firstName = hub.currentUser.name.split(" ")[0]
  const [greeting, setGreeting] = useState("Good day")
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening")
  }, [])

  // Top stats row. Storage/License mirror values already shown in the cards below;
  // Adoption is real (tenant scope or fleet average). Active Devices has no field in
  // /api/hub-data yet, so it is a clearly-labeled placeholder pending a real source.
  const statAdoption =
    scope.type === "tenant"
      ? scope.tenant.featureAdoption
      : Math.round(hub.tenants.reduce((a, t) => a + t.featureAdoption, 0) / Math.max(hub.tenants.length, 1))
  const toneColor: Record<string, string> = {
    critical: "var(--critical)",
    warning: "var(--warning)",
    primary: "var(--primary)",
    success: "var(--success)",
  }
  const dashboardStats = [
    { label: "Storage Used", icon: Database, value: "92 TB", sub: "of 100 TB", pct: 92, tone: "critical", delta: "+4 TB this week", placeholder: false },
    { label: "Active Devices", icon: Server, value: "127", sub: "across 9 sites", pct: 84, tone: "primary", delta: "+3 vs last month", placeholder: true },
    { label: "Feature Adoption", icon: CheckSquare, value: `${statAdoption}%`, sub: "tenant adoption", pct: statAdoption, tone: "primary", delta: "+12% this quarter", placeholder: false },
    { label: "License Expiry", icon: Clock, value: "45 days", sub: "renews Mar 15", pct: 38, tone: "warning", delta: "Renewal due soon", placeholder: false },
  ]
  const [isPollOpen, setIsPollOpen] = useState(false)
  const [pollAnswers, setPollAnswers] = useState({
    satisfaction: "",
    features: "",
    improvement: "",
    comments: "",
  })

  useEffect(() => {
    setCurrentNewsIndex((i) => (newsItems.length === 0 ? 0 : Math.min(i, newsItems.length - 1)))
  }, [newsItems.length, scope])

  useEffect(() => {
    setCurrentLatestNewsIndex((i) =>
      latestNewsForDisplay.length === 0 ? 0 : Math.min(i, latestNewsForDisplay.length - 1),
    )
  }, [latestNewsForDisplay.length, scope])

  const handlePrevLatestNews = () => {
    if (latestNewsForDisplay.length === 0) return
    setCurrentLatestNewsIndex((prev) => (prev === 0 ? latestNewsForDisplay.length - 1 : prev - 1))
  }

  const handleNextLatestNews = () => {
    if (latestNewsForDisplay.length === 0) return
    setCurrentLatestNewsIndex((prev) => (prev === latestNewsForDisplay.length - 1 ? 0 : prev + 1))
  }

  const handlePrevNews = () => {
    if (newsItems.length === 0) return
    setCurrentNewsIndex((prev) => (prev === 0 ? newsItems.length - 1 : prev - 1))
  }

  const handleNextNews = () => {
    if (newsItems.length === 0) return
    setCurrentNewsIndex((prev) => (prev === newsItems.length - 1 ? 0 : prev + 1))
  }

  const handlePollSubmit = () => {
    console.log("Poll submitted:", pollAnswers)
    setIsPollOpen(false)
    // Reset poll after submission
    setPollAnswers({
      satisfaction: "",
      features: "",
      improvement: "",
      comments: "",
    })
  }

  const handlePollClick = () => {
    setIsPollOpen(true)
  }

  const tenantAdoption = effectiveFeatureAdoption(hub, scope)
  const tenantAdoptionEnabled = tenantAdoption.prdData.filter((f) => f.enabled).length
  const showPortalFeatureSummary =
    isFeaturesOnlyTenant && tenantAdoption.prdData.length > 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Welcome to CTERA Hub AI"
          subtitle="Your all-in-one hub for CTERA updates, downloads and resources"
        />

        <div className="p-8">
          {/* Branded welcome hero */}
          <section
            className="relative mb-6 overflow-hidden rounded-2xl px-8 py-8 text-white shadow-md"
            style={{ background: "linear-gradient(120deg,#505be5 0%,#102341 100%)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ctera-curve.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-6 top-5 w-36 opacity-15"
            />
            <div className="relative">
              <div className="text-[13px] font-medium text-white/75">Welcome back</div>
              <h2 className="mt-2 mb-1.5 text-[27px] font-bold tracking-tight text-white">
                {greeting}, {firstName}
              </h2>
              <p className="max-w-lg text-sm text-white/85">
                Your all-in-one hub for CTERA updates, downloads and resources. Here&apos;s what needs your attention
                today.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button asChild className="bg-white text-[#102341] hover:bg-white/90">
                  <Link href="/insights">
                    <Sparkles className="mr-1.5 h-4 w-4" /> View AI recommendations
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="border border-white/20 bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href="/downloads">
                    <Download className="mr-1.5 h-4 w-4" /> Downloads
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Top stats row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((s) => {
              const color = toneColor[s.tone]
              return (
                <Card key={s.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <s.icon className="h-4 w-4" />
                      {s.label}
                    </div>
                    {s.placeholder && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
                        style={{ background: "color-mix(in srgb, var(--muted-foreground) 12%, transparent)" }}
                        title="Sample value — no device-count field in /api/hub-data yet"
                      >
                        Sample
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: color }} />
                  </div>
                  <div className="mt-2 text-[11px] font-semibold" style={{ color }}>
                    {s.delta}
                  </div>
                </Card>
              )
            })}
          </div>

          {showPortalFeatureSummary && scope.type === "tenant" && (
            <Card className="mb-6 border-primary/25 bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{scope.tenant.name}</CardTitle>
                <CardDescription>
                  Feature inventory for {scope.tenant.domain}: {tenantAdoptionEnabled} of {tenantAdoption.prdData.length}{" "}
                  features enabled (portal adoption {scope.tenant.featureAdoption}%).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/feature-adoption">Open Feature Adoption</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/portal">Open Deployment</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">AI Based Recommendations for You</CardTitle>
            </CardHeader>
            <CardContent>
              {newsItems.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No AI recommendations for this tenant.
                </p>
              ) : (
                <div className="relative">
                  <div className="overflow-hidden rounded-lg">
                    <div className="grid gap-6 md:grid-cols-3">
                      {[0, 1, 2].map((offset) => {
                        const index = (currentNewsIndex + offset) % newsItems.length
                        const article = newsItems[index]
                        return (
                          <Card key={index} className="overflow-hidden">
                            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                              <img
                                src={article.image || "/placeholder.svg"}
                                alt={article.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <CardHeader>
                              <div className="text-xs font-medium text-primary">{article.category}</div>
                              <CardTitle className="text-sm">{article.title}</CardTitle>
                              <CardDescription className="line-clamp-2 text-xs">{article.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button variant="link" className="h-auto p-0 text-xs">
                                Learn more →
                              </Button>
                              <div className="mt-4 border-t pt-4">
                                <p className="text-xs font-bold text-muted-foreground">
                                  Why am I getting this recommendation?
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">{article.reason}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrevNews} className="h-8 w-8 bg-transparent">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {newsItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentNewsIndex(index)}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === currentNewsIndex ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextNews} className="h-8 w-8 bg-transparent">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My CTERA Space</CardTitle>
                <span className="text-sm text-muted-foreground">Last Updated: {myCteraSpaceLastUpdated}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isFeaturesOnlyTenant ? "" : "lg:grid-cols-3"}`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Installed Versions Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestVersions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No installed version data for this tenant.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {latestVersions.map((item) => {
                          const VersionIcon = getDashboardVersionIcon(
                            "icon" in item ? (item as { icon?: string }).icon : undefined,
                          )
                          return (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                  <VersionIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{item.name}</div>
                                  <div className="text-xs text-muted-foreground">v{item.version}</div>
                                </div>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <Button variant="link" className="mt-4 h-auto p-0 text-sm">
                      View all download
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Device Fleet KPI */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Device Fleet</CardTitle>
                      <span className="text-xs text-muted-foreground">{fleetDevices.length} devices</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fleetDevices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No device data for this tenant.</p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {[0, 1, 2].slice(0, Math.min(3, fleetDevices.length)).map((offset) => {
                            const d = fleetDevices[(deviceKpiIndex + offset) % fleetDevices.length]
                            const Icon = getDeviceIcon("icon" in d ? (d as { icon?: string }).icon : undefined)
                            return (
                              <div key={`${d.name}-${offset}`} className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">{d.name}</div>
                                  <div className="truncate text-xs text-muted-foreground">{d.type}</div>
                                </div>
                                <StatusBadge status={d.status} />
                              </div>
                            )
                          })}
                        </div>
                        {fleetDevices.length > 3 && (
                          <div className="mt-3 flex items-center justify-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              aria-label="Previous devices"
                              onClick={() => setDeviceKpiIndex((i) => (i - 1 + fleetDevices.length) % fleetDevices.length)}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-[11px] text-muted-foreground">
                              top 3 of {fleetDevices.length}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              aria-label="Next devices"
                              onClick={() => setDeviceKpiIndex((i) => (i + 1) % fleetDevices.length)}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        <Button asChild variant="link" className="mt-3 h-auto p-0 text-sm">
                          <Link href="/portal">
                            View all in Deployment
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Feature Adoption rate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Feature Adoption Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="font-display text-4xl font-bold text-primary">{statAdoption}%</div>
                      {tenantAdoption.prdData.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {tenantAdoptionEnabled} of {tenantAdoption.prdData.length} enabled
                        </div>
                      )}
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${statAdoption}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Capabilities enabled for {scope.type === "tenant" ? scope.tenant.name : "your fleet"}.
                    </p>
                    <Button asChild variant="link" className="mt-2 h-auto p-0 text-sm">
                      <Link href="/feature-adoption">
                        View Feature Adoption
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {!isFeaturesOnlyTenant && (
                  <>
                    <Card
                      className="shadow-none"
                      style={{
                        background: "color-mix(in srgb, var(--warning) 8%, transparent)",
                        borderColor: "color-mix(in srgb, var(--warning) 35%, transparent)",
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: "var(--warning)" }}>
                          <Clock className="h-5 w-5" />
                          License Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Status</span>
                          <Badge
                            className="border-transparent"
                            style={{
                              background: "color-mix(in srgb, var(--warning) 15%, transparent)",
                              color: "var(--warning)",
                            }}
                          >
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Expires In</span>
                          <span className="text-sm font-bold" style={{ color: "var(--warning)" }}>
                            45 days
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Expiration Date</span>
                          <span className="text-sm font-semibold text-foreground">March 15, 2025</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Contact your account manager to renew your license and avoid service disruptions.
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className="shadow-none"
                      style={{
                        background: "color-mix(in srgb, var(--critical) 8%, transparent)",
                        borderColor: "color-mix(in srgb, var(--critical) 35%, transparent)",
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: "var(--critical)" }}>
                          <Database className="h-5 w-5" />
                          Storage Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Usage</span>
                            <span className="text-base font-bold text-foreground">92 TB / 100 TB</span>
                          </div>
                          <div
                            className="h-3 w-full overflow-hidden rounded-full"
                            style={{ background: "color-mix(in srgb, var(--critical) 18%, transparent)" }}
                          >
                            <div
                              className="h-3 rounded-full"
                              style={{ width: "92%", background: "var(--critical)" }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: "var(--critical)" }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Storage is near capacity. Expand now to prevent automatic quota enforcement.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Latest News</CardTitle>
            </CardHeader>
            <CardContent>
              {latestNewsForDisplay.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No latest news available.</p>
              ) : (
                <div className="relative">
                  <div className="overflow-hidden rounded-lg">
                    <div className="grid gap-4 lg:grid-cols-4">
                      {[0, 1, 2, 3].map((offset) => {
                        const index = (currentLatestNewsIndex + offset) % latestNewsForDisplay.length
                        const item = latestNewsForDisplay[index]
                        const Icon = getDashboardNewsIcon(
                          "icon" in item ? (item as { icon?: string }).icon : undefined,
                        )

                        return (
                          <Card key={index} className={`flex flex-col bg-gradient-to-br ${item.gradient} text-white`}>
                            <CardHeader className="pb-4">
                              <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                <span className="text-sm font-semibold">{item.title}</span>
                              </div>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col gap-4">
                              {item.metric && (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold">{item.metric}</span>
                                  {item.type === "ai-insight" && <TrendingUp className="h-5 w-5" />}
                                </div>
                              )}
                              <p className="flex-1 text-sm text-white/90">{item.description}</p>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={item.type === "poll" ? handlePollClick : undefined}
                              >
                                {item.primaryAction}
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevLatestNews}
                      className="h-8 w-8 bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {latestNewsForDisplay.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentLatestNewsIndex(index)}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === currentLatestNewsIndex ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextLatestNews}
                      className="h-8 w-8 bg-transparent"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isPollOpen} onOpenChange={setIsPollOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Your Opinion Matters
            </DialogTitle>
            <DialogDescription>
              Help us shape the future of CTERA by sharing your feedback on our latest features and improvements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">How satisfied are you with CTERA's latest features?</Label>
              <RadioGroup
                value={pollAnswers.satisfaction}
                onValueChange={(value) => setPollAnswers({ ...pollAnswers, satisfaction: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very-satisfied" id="very-satisfied" />
                  <Label htmlFor="very-satisfied" className="font-normal">
                    Very Satisfied
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satisfied" id="satisfied" />
                  <Label htmlFor="satisfied" className="font-normal">
                    Satisfied
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="neutral" />
                  <Label htmlFor="neutral" className="font-normal">
                    Neutral
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dissatisfied" id="dissatisfied" />
                  <Label htmlFor="dissatisfied" className="font-normal">
                    Dissatisfied
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very-dissatisfied" id="very-dissatisfied" />
                  <Label htmlFor="very-dissatisfied" className="font-normal">
                    Very Dissatisfied
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Which new features are you most excited about?</Label>
              <RadioGroup
                value={pollAnswers.features}
                onValueChange={(value) => setPollAnswers({ ...pollAnswers, features: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ai-insights" id="ai-insights" />
                  <Label htmlFor="ai-insights" className="font-normal">
                    AI-Powered Insights & Analytics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mcp" id="mcp" />
                  <Label htmlFor="mcp" className="font-normal">
                    MCP (Management Control Plane)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file-locking" id="file-locking" />
                  <Label htmlFor="file-locking" className="font-normal">
                    Global File Locking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dashboard" id="dashboard" />
                  <Label htmlFor="dashboard" className="font-normal">
                    Enhanced Portal Dashboard
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">What area needs the most improvement?</Label>
              <RadioGroup
                value={pollAnswers.improvement}
                onValueChange={(value) => setPollAnswers({ ...pollAnswers, improvement: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="performance" id="performance" />
                  <Label htmlFor="performance" className="font-normal">
                    Performance & Speed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ui-ux" id="ui-ux" />
                  <Label htmlFor="ui-ux" className="font-normal">
                    User Interface & Experience
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="documentation" id="documentation" />
                  <Label htmlFor="documentation" className="font-normal">
                    Documentation & Support
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="security" id="security" />
                  <Label htmlFor="security" className="font-normal">
                    Security Features
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integration" id="integration" />
                  <Label htmlFor="integration" className="font-normal">
                    Integration Capabilities
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="comments" className="text-base font-semibold">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="comments"
                placeholder="Share any additional thoughts or suggestions..."
                value={pollAnswers.comments}
                onChange={(e) => setPollAnswers({ ...pollAnswers, comments: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsPollOpen(false)} className="flex-1">
              Skip
            </Button>
            <Button onClick={handlePollSubmit} className="flex-1">
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
