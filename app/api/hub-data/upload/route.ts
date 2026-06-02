import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { parseAndNormalizeHub, writeHubDocumentAtomic } from "@/lib/hub-persist"

export const dynamic = "force-dynamic"

function checkWriteAuthorized(req: Request): boolean {
  const token = process.env.HUB_ADMIN_TOKEN
  if (!token) return true
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function POST(req: Request) {
  if (!checkWriteAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 })
  }

  const name = file.name?.toLowerCase() ?? ""
  if (!name.endsWith(".json")) {
    return NextResponse.json({ error: "Upload must be a .json file" }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    return NextResponse.json({ error: "File is not valid JSON" }, { status: 400 })
  }

  try {
    const normalized = parseAndNormalizeHub(raw)
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
