"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Building2, TrendingUp, Users, CheckCircle2, ArrowRight } from "lucide-react"
import { useHub } from "@/components/hub-provider"

export default function PeerReviewPage() {
  const { hub } = useHub()
  const { industryData, topProducts, commonFeatures, deploymentPatterns } = hub.peerReview

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="border-b bg-card">
          <div className="flex h-16 items-center px-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Peer Review</h1>
              <p className="text-sm text-muted-foreground">
                See what other {industryData.yourIndustry} organizations are using
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Industry</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{industryData.yourIndustry}</div>
                <p className="text-xs text-muted-foreground">{industryData.peerCount} peer organizations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deployment</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{industryData.avgDeploymentSize}</div>
                <p className="text-xs text-muted-foreground">Average across peers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Analyzed</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Last 90 Days</div>
                <p className="text-xs text-muted-foreground">Updated weekly</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Popular Products</CardTitle>
              <CardDescription>Products used by {industryData.yourIndustry} organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {topProducts.map((product) => (
                <div key={product.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {product.trend}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{product.adoption}% adoption</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <Progress value={product.adoption} className="h-2" />
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Common Features</CardTitle>
                <CardDescription>Features most frequently enabled by peers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commonFeatures.map((feature) => (
                  <div key={feature.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{feature.name}</span>
                        {feature.critical && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{feature.usage}%</span>
                    </div>
                    <Progress value={feature.usage} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Patterns</CardTitle>
                <CardDescription>Common architecture choices in {industryData.yourIndustry}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {deploymentPatterns.map((pattern) => (
                  <div key={pattern.pattern} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{pattern.pattern}</h3>
                      <span className="text-sm font-medium">{pattern.percentage}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    <Progress value={pattern.percentage} className="h-2" />
                  </div>
                ))}
                <Button className="w-full mt-4 bg-transparent" variant="outline">
                  <span>View Detailed Architecture Guide</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Based on Peer Analysis</h3>
                <p className="mt-1 text-sm text-blue-700">
                  This data is compiled from anonymized usage patterns of {industryData.peerCount} organizations in the{" "}
                  {industryData.yourIndustry} industry. All metrics are updated weekly to reflect current trends and
                  best practices.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
