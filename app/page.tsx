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
import { getDashboardNewsIcon, getDashboardVersionIcon } from "@/lib/lucide-icon-map"
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

                {!isFeaturesOnlyTenant && (
                  <>
                    <Card className="border-orange-200 bg-orange-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-orange-900">
                          <Clock className="h-5 w-5 text-orange-600" />
                          License Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Status</span>
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Expires In</span>
                          <span className="text-sm font-bold text-orange-600">45 days</span>
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

                    <Card className="border-red-200 bg-red-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-red-900">
                          <Database className="h-5 w-5 text-red-600" />
                          Storage Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Usage</span>
                            <span className="text-base font-bold text-foreground">92 TB / 100 TB</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-red-100">
                            <div className="h-3 rounded-full bg-red-500" style={{ width: "92%" }}></div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
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
              <CheckSquare className="h-5 w-5 text-purple-600" />
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
            <Button onClick={handlePollSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
