import type { Customer, Deployment } from "@/lib/customer-schema"
import type { Tenant } from "@/lib/hub-schema"
import type { HubResponsePayload } from "@/lib/hub-types"
import { seedCustomers } from "@/lib/seed-hub/parts/customers"
import { seedDeployments } from "@/lib/seed-hub/parts/deployments"

type HubWithHierarchy = HubResponsePayload & {
  customers?: Customer[]
  deployments?: Deployment[]
}

/** Customers from hub document or derived from legacy tenants. */
export function resolveCustomers(hub: HubWithHierarchy): Customer[] {
  if (hub.customers?.length) return hub.customers
  return hub.tenants.map((t) => ({
    id: t.id,
    name: t.name,
    region: t.region,
    plan: t.plan,
    status: t.status,
    users: t.users,
    storage: t.storage,
    featureAdoption: t.featureAdoption,
  }))
}

/** Deployments from hub document or one deployment per legacy tenant. */
export function resolveDeployments(hub: HubWithHierarchy): Deployment[] {
  if (hub.deployments?.length) return hub.deployments
  return hub.tenants.map((t) => ({
    id: `${t.id}-prod`,
    customerId: t.id,
    name: "Production",
    dnsSuffix: t.domain,
    region: t.region,
    status: t.status,
  }))
}

export function deploymentsForCustomer(deployments: Deployment[], customerId: string): Deployment[] {
  return deployments.filter((d) => d.customerId === customerId)
}

export function customerForDeployment(customers: Customer[], deployment: Deployment): Customer | undefined {
  return customers.find((c) => c.id === deployment.customerId)
}

/** Map deployment to legacy tenant shape for admin tables / imports. */
export function tenantFromDeployment(customer: Customer, deployment: Deployment): Tenant {
  return {
    id: deployment.id,
    name: customer.name,
    domain: deployment.dnsSuffix,
    region: deployment.region,
    users: customer.users ?? 0,
    storage: customer.storage ?? "—",
    featureAdoption: customer.featureAdoption ?? 0,
    status: deployment.status,
    plan: customer.plan,
    contentProfile: hubHasDeploymentSpace(deployment.id) ? "features-only" : "default",
  }
}

function hubHasDeploymentSpace(_deploymentId: string): boolean {
  return false
}

export function defaultCustomerDeployment(
  customers: Customer[],
  deployments: Deployment[],
): { customer: Customer; deployment: Deployment } | null {
  const customer = customers[0]
  if (!customer) return null
  const list = deploymentsForCustomer(deployments, customer.id)
  const deployment = list[0]
  if (!deployment) return null
  return { customer, deployment }
}

export function findCustomerDeployment(
  customers: Customer[],
  deployments: Deployment[],
  customerId: string,
  deploymentId: string,
): { customer: Customer; deployment: Deployment } | null {
  const customer = customers.find((c) => c.id === customerId)
  const deployment = deployments.find((d) => d.id === deploymentId && d.customerId === customerId)
  if (!customer || !deployment) return null
  return { customer, deployment }
}

/** Seed defaults when hub has no explicit customers/deployments arrays. */
export function seedHierarchyDefaults(hub: HubWithHierarchy): { customers: Customer[]; deployments: Deployment[] } {
  const customers = hub.customers?.length ? hub.customers : seedCustomers
  const deployments = hub.deployments?.length ? hub.deployments : seedDeployments
  return { customers, deployments }
}
