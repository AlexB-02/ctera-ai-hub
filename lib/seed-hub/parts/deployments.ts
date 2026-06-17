import type { Deployment } from "@/lib/customer-schema"

export const seedDeployments: Deployment[] = [
  // Acme — multi-region
  {
    id: "acme-eu",
    customerId: "acme",
    name: "EU Production",
    dnsSuffix: "acme.ctera.com",
    region: "EU-West",
    status: "active",
  },
  {
    id: "acme-us",
    customerId: "acme",
    name: "US DR",
    dnsSuffix: "acme-us.ctera.com",
    region: "US-East",
    status: "active",
  },
  // Wayne — multi-site
  {
    id: "wayne-primary",
    customerId: "wayne",
    name: "Primary DC",
    dnsSuffix: "wayne.ctera.com",
    region: "US-East",
    status: "active",
  },
  {
    id: "wayne-eu",
    customerId: "wayne",
    name: "EU Operations",
    dnsSuffix: "wayne-eu.ctera.com",
    region: "EU-West",
    status: "active",
  },
  // Globex — two deployments
  {
    id: "globex-us",
    customerId: "globex",
    name: "US HQ",
    dnsSuffix: "globex.ctera.com",
    region: "US-West",
    status: "active",
  },
  {
    id: "globex-research",
    customerId: "globex",
    name: "Research Lab",
    dnsSuffix: "globex-rd.ctera.com",
    region: "US-West",
    status: "active",
  },
  // Single-deployment customers
  { id: "customer-prod", customerId: "customer", name: "Production", dnsSuffix: "customer.ctera.com", region: "US-East", status: "active" },
  { id: "initech-prod", customerId: "initech", name: "Production", dnsSuffix: "initech.ctera.com", region: "US-Central", status: "active" },
  { id: "umbrella-prod", customerId: "umbrella", name: "Production", dnsSuffix: "umbrella.ctera.com", region: "APAC", status: "active" },
  { id: "stark-prod", customerId: "stark", name: "Production", dnsSuffix: "stark.ctera.com", region: "US-East", status: "active" },
  { id: "soylent-trial", customerId: "soylent", name: "Trial", dnsSuffix: "soylent.ctera.com", region: "EU-Central", status: "trial" },
  { id: "hooli-prod", customerId: "hooli", name: "Production", dnsSuffix: "hooli.ctera.com", region: "US-West", status: "active" },
  { id: "pied-piper-prod", customerId: "pied-piper", name: "Production", dnsSuffix: "piedpiper.ctera.com", region: "US-West", status: "active" },
  { id: "cyberdyne-prod", customerId: "cyberdyne", name: "Production", dnsSuffix: "cyberdyne.ctera.com", region: "US-West", status: "active" },
  { id: "tyrell-prod", customerId: "tyrell", name: "Production", dnsSuffix: "tyrell.ctera.com", region: "EU-West", status: "suspended" },
]
