import type { Customer, Deployment } from "@/lib/customer-schema"
import type { SeedHubData } from "@/lib/seed-hub"
import type { DeploymentSpacePayload } from "@/lib/seed-hub/parts/deployment-spaces"

export function upsertCustomerInHub(hub: SeedHubData, customer: Customer): SeedHubData {
  const list = hub.customers ?? []
  const idx = list.findIndex((c) => c.id === customer.id)
  const customers =
    idx === -1 ? [...list, customer] : [...list.slice(0, idx), customer, ...list.slice(idx + 1)]
  return { ...hub, customers }
}

export function upsertDeploymentInHub(hub: SeedHubData, deployment: Deployment): SeedHubData {
  const list = hub.deployments ?? []
  const idx = list.findIndex((d) => d.id === deployment.id)
  const deployments =
    idx === -1 ? [...list, deployment] : [...list.slice(0, idx), deployment, ...list.slice(idx + 1)]
  return { ...hub, deployments }
}

export function upsertDeploymentSpaceInHub(
  hub: SeedHubData,
  deploymentId: string,
  space: DeploymentSpacePayload,
): SeedHubData {
  return {
    ...hub,
    deploymentSpaces: {
      ...hub.deploymentSpaces,
      [deploymentId]: {
        ...hub.deploymentSpaces?.[deploymentId],
        ...space,
      },
    },
  }
}
