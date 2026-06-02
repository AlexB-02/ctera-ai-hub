import { readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"
import { hubDocumentSchema, type HubDocument } from "@/lib/hub-schema"
import { computeGlobalStats } from "@/lib/global-stats"
import type { HubResponsePayload } from "@/lib/hub-types"
import { defaultsMerge } from "@/lib/hub-defaults-merge"
import { seedHubData, type SeedHubData } from "@/lib/seed-hub"

export const HUB_JSON_PATH = join(process.cwd(), "data", "hub.json")

export function loadPublicSeedBuffer(): Buffer | null {
  try {
    return readFileSync(join(process.cwd(), "public", "seed.hub.json"))
  } catch {
    return null
  }
}

export function parseAndNormalizeHub(raw: unknown): SeedHubData {
  const parsed = hubDocumentSchema.parse(raw) as HubDocument & Record<string, unknown>
  return defaultsMerge(seedHubData as unknown as Record<string, unknown>, parsed) as SeedHubData
}

export function loadPersistedHubRaw(): unknown | null {
  try {
    const buf = readFileSync(HUB_JSON_PATH)
    return JSON.parse(buf.toString("utf8"))
  } catch {
    return null
  }
}

export function loadEffectiveHubData(): SeedHubData {
  const persisted = loadPersistedHubRaw()
  if (persisted) {
    try {
      return parseAndNormalizeHub(persisted)
    } catch {
      /* fall through */
    }
  }
  const pub = loadPublicSeedBuffer()
  if (pub) {
    try {
      return parseAndNormalizeHub(JSON.parse(pub.toString("utf8")))
    } catch {
      /* fall through */
    }
  }
  return structuredClone(seedHubData)
}

export function toApiPayload(data: SeedHubData): HubResponsePayload {
  return {
    ...data,
    globalStats: computeGlobalStats(data.tenants),
  }
}

export function writeHubDocumentAtomic(data: SeedHubData): void {
  const stored = { ...data } as Record<string, unknown>
  delete stored.globalStats
  mkdirSync(dirname(HUB_JSON_PATH), { recursive: true })
  const tmp = `${HUB_JSON_PATH}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(stored, null, 2), "utf8")
  try {
    renameSync(tmp, HUB_JSON_PATH)
  } catch {
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    throw new Error("Failed to write hub data file")
  }
}
