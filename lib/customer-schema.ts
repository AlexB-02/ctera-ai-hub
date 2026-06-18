import { z } from "zod"

/** Customer organization — may have multiple portal deployments. */
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  plan: z.enum(["Enterprise", "Business", "Starter"]),
  status: z.enum(["active", "trial", "suspended"]),
  users: z.number().optional(),
  storage: z.string().optional(),
  featureAdoption: z.number().optional(),
})

/** A single Portal deployment (virtual portal) under a customer. */
export const deploymentSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  dnsSuffix: z.string(),
  region: z.string(),
  status: z.enum(["active", "trial", "suspended"]).default("active"),
})

export type Customer = z.infer<typeof customerSchema>
export type Deployment = z.infer<typeof deploymentSchema>
