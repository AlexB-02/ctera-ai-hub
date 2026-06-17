import { z } from "zod"
import { customerSchema, deploymentSchema } from "@/lib/customer-schema"

export { customerSchema, deploymentSchema }
export type { Customer, Deployment } from "@/lib/customer-schema"

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  region: z.string(),
  users: z.number(),
  storage: z.string(),
  featureAdoption: z.number(),
  status: z.enum(["active", "trial", "suspended"]),
  plan: z.enum(["Enterprise", "Business", "Starter"]),
  /** Tenants created from feature-inventory JSON only — hide global hub mock content on Dashboard / Deployment. */
  contentProfile: z.enum(["default", "features-only"]).optional(),
})

export const currentUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  role: z.string(),
  initials: z.string(),
})

/** Core fields are validated; all view sections are pass-through for flexibility. */
export const hubDocumentSchema = z
  .object({
    version: z.literal(1),
    tenants: z.array(tenantSchema),
    customers: z.array(customerSchema).optional(),
    deployments: z.array(deploymentSchema).optional(),
    currentUser: currentUserSchema,
  })
  .passthrough()

export type Tenant = z.infer<typeof tenantSchema>
export type HubDocument = z.infer<typeof hubDocumentSchema>
