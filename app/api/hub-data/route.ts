import { NextResponse } from "next/server"
import { ZodError } from "zod"
import {
  loadEffectiveHubData,
  parseAndNormalizeHub,
  toApiPayload,
  writeHubDocumentAtomic,
} from "@/lib/hub-persist"

export const dynamic = "force-dynamic"

function checkWriteAuthorized(req: Request): boolean {
  const token = process.env.HUB_ADMIN_TOKEN
  if (!token) return true
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function GET() {
  try {
    const data = loadEffectiveHubData()
    return NextResponse.json(toApiPayload(data))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to load hub data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!checkWriteAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const normalized = parseAndNormalizeHub(body)
    writeHubDocumentAtomic(normalized)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.flatten() }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "Failed to persist hub data" }, { status: 500 })
  }
}
