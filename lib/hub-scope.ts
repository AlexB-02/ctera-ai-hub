import type { Customer, Deployment } from "@/lib/customer-schema"

export type HubScope =
  | { type: "global" }
  | { type: "deployment"; customer: Customer; deployment: Deployment }

export function scopeDeploymentId(scope: HubScope): string {
  return scope.type === "deployment" ? scope.deployment.id : "__global"
}

export function scopeLabel(scope: HubScope): { title: string; subtitle: string } {
  if (scope.type === "global") return { title: "Global view", subtitle: "All customers" }
  return {
    title: scope.customer.name,
    subtitle: scope.deployment.dnsSuffix,
  }
}
