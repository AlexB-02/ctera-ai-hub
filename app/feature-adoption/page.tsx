"use client"

import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { effectiveFeatureAdoption } from "@/lib/tenant-hub-views"

const categoryColors: Record<string, string> = {
  Infrastructure: "bg-blue-50 text-blue-700 border border-blue-200",
  Services: "bg-violet-50 text-violet-700 border border-violet-200",
  "Tenant Settings": "bg-amber-50 text-amber-700 border border-amber-200",
  "Global Settings": "bg-emerald-50 text-emerald-700 border border-emerald-200",
}

const categoryFallback = "bg-muted text-foreground border border-border"

function FeatureGrid({ features }: { features: { name: string; description: string; enabled: boolean }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {features.map((feature, idx) => (
        <Card key={idx} className="shadow-none">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">{feature.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </div>
              {feature.enabled ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-500">
                  <X className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Disabled</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export default function FeatureAdoption() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const { featureAdoptionData, prdData, categorySummary } = effectiveFeatureAdoption(hub, scope)

  const totalEnabled = prdData.filter((f) => f.enabled).length
  const totalDisabled = prdData.filter((f) => !f.enabled).length
  const scopeLabel =
    scope.type === "global" ? "All tenants (reference catalog)" : scope.tenant.domain

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Feature Adoption</h1>
            <p className="text-sm text-muted-foreground mt-1">Feature status for {scopeLabel}</p>
          </div>

          <Tabs defaultValue="prd" className="space-y-6">
            <TabsList>
              <TabsTrigger value="prd">PRD</TabsTrigger>
              <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="tenant-settings">Tenant Settings</TabsTrigger>
              <TabsTrigger value="global-settings">Global Settings</TabsTrigger>
            </TabsList>

            {/* PRD Tab */}
            <TabsContent value="prd" className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Product Requirements Document</h2>
                <Badge variant="outline" className="text-xs font-normal">
                  {prdData.length} features
                </Badge>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                <Card className="col-span-2 lg:col-span-1 bg-muted/40 shadow-none">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
                    <CardTitle className="text-3xl font-bold">{prdData.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="col-span-1 shadow-none bg-emerald-50 border-emerald-200">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <p className="text-[11px] text-emerald-700 uppercase tracking-wide">Enabled</p>
                    <CardTitle className="text-3xl font-bold text-emerald-700">{totalEnabled}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="col-span-1 shadow-none bg-red-50 border-red-200">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <p className="text-[11px] text-red-600 uppercase tracking-wide">Disabled</p>
                    <CardTitle className="text-3xl font-bold text-red-600">{totalDisabled}</CardTitle>
                  </CardHeader>
                </Card>
                {categorySummary.map((cat) => (
                  <Card key={cat.label} className="col-span-1 shadow-none">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <p className="text-[11px] text-muted-foreground truncate">{cat.label}</p>
                      <div className="flex items-baseline gap-1">
                        <CardTitle className="text-2xl font-bold">{cat.total}</CardTitle>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="text-emerald-600 font-medium">{cat.enabled} on</span>
                        {" / "}
                        <span className="text-red-500 font-medium">{cat.disabled} off</span>
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* PRD Table */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Full Feature Requirements</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    All {prdData.length} features{categorySummary.length > 0 ? ` across ${categorySummary.length} categories` : ""}{" "}
                    with purpose and deployment requirements
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
                          <TableHead className="w-[90px] text-center pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prdData.map((feature, idx) => {
                          const isNewCategory = idx === 0 || prdData[idx - 1].category !== feature.category
                          return (
                            <TableRow
                              key={idx}
                              className={isNewCategory && idx !== 0 ? "border-t-2 border-border" : ""}
                            >
                              <TableCell className="pl-6 align-top py-3.5">
                                {isNewCategory && (
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryColors[feature.category] ?? categoryFallback}`}
                                  >
                                    {feature.category}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="align-top py-3.5 text-sm font-medium">{feature.name}</TableCell>
                              <TableCell className="align-top py-3.5 text-sm text-muted-foreground">{feature.description}</TableCell>
                              <TableCell className="align-top py-3.5 text-sm text-muted-foreground leading-relaxed">{feature.purpose}</TableCell>
                              <TableCell className="align-top py-3.5 text-sm text-muted-foreground leading-relaxed">{feature.requirement}</TableCell>
                              <TableCell className="align-top py-3.5 text-center pr-6">
                                {feature.enabled ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                    <Check className="h-3.5 w-3.5" />Enabled
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                                    <X className="h-3.5 w-3.5" />Disabled
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Infrastructure Tab */}
            <TabsContent value="infrastructure" className="space-y-4">
              <FeatureGrid features={featureAdoptionData.infrastructure} />
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4">
              <FeatureGrid features={featureAdoptionData.services} />
            </TabsContent>

            {/* Tenant Settings Tab */}
            <TabsContent value="tenant-settings" className="space-y-4">
              <FeatureGrid features={featureAdoptionData.tenantSettings} />
            </TabsContent>

            {/* Global Settings Tab */}
            <TabsContent value="global-settings" className="space-y-4">
              <FeatureGrid features={featureAdoptionData.globalSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
