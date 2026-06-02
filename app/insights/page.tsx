"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, TrendingUp, AlertCircle, Clock, Check, X } from "lucide-react"
import { useHub } from "@/components/hub-provider"

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-50 border-red-200"
    case "Medium":
      return "bg-yellow-50 border-yellow-200"
    case "Low":
      return "bg-green-50 border-green-200"
    default:
      return "bg-gray-50"
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "High":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Priority: High</Badge>
    case "Medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Priority: Medium</Badge>
    case "Low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Priority: Low</Badge>
    default:
      return <Badge variant="secondary">Priority: {priority}</Badge>
  }
}

export default function HubAIInsights() {
  const { hub } = useHub()
  const { recommendations } = hub.insights

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                AI Recommendations Hub
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-Powered Recommendations - Personalized insights based on your infrastructure and usage patterns
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.map((rec, index) => (
              <Card key={index} className={getPriorityColor(rec.priority)}>
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  <img src={rec.image || "/placeholder.svg"} alt={rec.title} className="h-full w-full object-cover" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {rec.priority === "High" && <AlertCircle className="h-5 w-5 text-red-600" />}
                      {rec.priority === "Medium" && <Clock className="h-5 w-5 text-yellow-600" />}
                      {rec.priority === "Low" && <TrendingUp className="h-5 w-5 text-green-600" />}
                      <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
                    </div>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <CardTitle className="text-xl mt-2">{rec.title}</CardTitle>
                  <CardDescription className="text-sm">{rec.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {rec.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button className="flex-1">Take Action</Button>
                    <Button variant="outline" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
