import type { GlobalStats } from "@/lib/global-stats"
import type { SeedHubData } from "@/lib/seed-hub"

export type HubResponsePayload = SeedHubData & { globalStats: GlobalStats }
