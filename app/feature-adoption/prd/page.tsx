"use client"

import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { effectiveFeatureAdoption } from "@/lib/tenant-hub-views"

const categoryColors: Record<string, string> = {
  Infrastructure: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Services: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Tenant Settings": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Global Settings": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const categoryFallback =
  "bg-muted text-foreground dark:bg-muted/50 dark:text-foreground border border-border"

export default function FeatureAdoptionPRD() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const { prdData, categorySummary } = effectiveFeatureAdoption(hub, scope)

  const totalEnabled = prdData.filter((f) => f.enabled).length
  const totalDisabled = prdData.filter((f) => !f.enabled).length
  const scopeLabel =
    scope.type === "global" ? "All tenants (reference catalog)" : scope.tenant.domain

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Feature Adoption PRD</h1>
              <Badge variant="outline" className="text-xs font-normal">
                Product Requirements Document
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Complete feature inventory and requirements for{" "}
              <span className="font-medium text-foreground">{scopeLabel}</span>
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <Card className="col-span-2 lg:col-span-1 bg-muted/40">
              <CardHeader className="pb-2 pt-4 px-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Features</p>
                <CardTitle className="text-3xl font-bold">{prdData.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="col-span-1 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardHeader className="pb-2 pt-4 px-4">
                <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide">Enabled</p>
                <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-400">{totalEnabled}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="col-span-1 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
              <CardHeader className="pb-2 pt-4 px-4">
                <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">Disabled</p>
                <CardTitle className="text-3xl font-bold text-red-700 dark:text-red-400">{totalDisabled}</CardTitle>
              </CardHeader>
            </Card>
            {categorySummary.map((cat) => (
              <Card key={cat.label} className="col-span-1">
                <CardHeader className="pb-2 pt-4 px-4">
                  <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <CardTitle className="text-2xl font-bold">{cat.total}</CardTitle>
                    <span className="text-xs text-muted-foreground">features</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-medium">{cat.enabled} on</span>
                    {" / "}
                    <span className="text-red-600 font-medium">{cat.disabled} off</span>
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* PRD Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full Feature Requirements Table</CardTitle>
              <p className="text-sm text-muted-foreground">
                {prdData.length} features
                {categorySummary.length > 0 ? ` across ${categorySummary.length} categories` : ""}, with purpose and
                deployment requirements
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[140px] pl-6">Category</TableHead>
                      <TableHead className="w-[200px]">Feature Name</TableHead>
                      <TableHead className="w-[180px]">Description</TableHead>
                      <TableHead className="min-w-[260px]">Purpose</TableHead>
                      <TableHead className="min-w-[260px]">Deployment Requirement</TableHead>
                      <TableHead className="w-[100px] text-center pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prdData.map((feature, idx) => {
                      const isNewCategory =
                        idx === 0 || prdData[idx - 1].category !== feature.category

                      return (
                        <TableRow
                          key={idx}
                          className={isNewCategory && idx !== 0 ? "border-t-2 border-border" : ""}
                        >
                          <TableCell className="pl-6 align-top py-4">
                            {isNewCategory && (
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${categoryColors[feature.category] ?? categoryFallback}`}
                              >
                                {feature.category}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="align-top py-4 font-medium text-sm">
                            {feature.name}
                          </TableCell>
                          <TableCell className="align-top py-4 text-sm text-muted-foreground">
                            {feature.description}
                          </TableCell>
                          <TableCell className="align-top py-4 text-sm text-muted-foreground leading-relaxed">
                            {feature.purpose}
                          </TableCell>
                          <TableCell className="align-top py-4 text-sm text-muted-foreground leading-relaxed">
                            {feature.requirement}
                          </TableCell>
                          <TableCell className="align-top py-4 text-center pr-6">
                            {feature.enabled ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                <Check className="h-3.5 w-3.5" />
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                                <X className="h-3.5 w-3.5" />
                                Disabled
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
        </div>
      </main>
    </div>
  )
}
