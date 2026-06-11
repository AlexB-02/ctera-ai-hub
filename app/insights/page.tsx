"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { getDashboardNewsIcon } from "@/lib/lucide-icon-map"

const REC_GRADIENTS = [
  "var(--grad-primary)",
  "var(--grad-teal)",
  "var(--grad-partners)",
  "var(--grad-customers)",
]

function priorityColor(priority: string) {
  switch (priority) {
    case "High":
      return "var(--critical)"
    case "Medium":
      return "var(--warning)"
    default:
      return "var(--success)"
  }
}

export default function HubAIInsights() {
  const { hub } = useHub()
  const { recommendations } = hub.insights

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="AI Recommendations Hub"
          subtitle="Personalized insights based on your infrastructure and usage patterns"
        />

        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.map((rec, index) => {
              const pc = priorityColor(rec.priority)
              const RecIcon = getDashboardNewsIcon(
                "icon" in rec ? (rec as { icon?: string }).icon : undefined,
              )
              return (
                <Card key={index} className="flex flex-col overflow-hidden">
                  <div
                    className="relative flex h-28 items-center justify-center overflow-hidden text-white"
                    style={{ background: REC_GRADIENTS[index % REC_GRADIENTS.length] }}
                  >
                    <RecIcon className="h-12 w-12 opacity-95" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#102341] shadow-sm">
                      {rec.category}
                    </span>
                  </div>
                  <CardHeader className="pb-2">
                    <span
                      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: `color-mix(in srgb, ${pc} 12%, transparent)`, color: pc }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: pc }} />
                      {rec.priority} priority
                    </span>
                    <CardTitle className="mt-2 text-lg font-bold">{rec.title}</CardTitle>
                    <CardDescription className="text-[13px]">{rec.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <ul className="space-y-2">
                      {rec.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[13px]">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--success)" }} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex gap-2">
                      <Button className="flex-1">Take Action</Button>
                      <Button variant="outline" size="icon" aria-label="Dismiss recommendation">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
