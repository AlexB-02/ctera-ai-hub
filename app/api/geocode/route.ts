import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Proxy geocoding to Nominatim (OpenStreetMap). Supply a descriptive User-Agent per their policy.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
  }

  const upstream = new URL("https://nominatim.openstreetmap.org/search")
  upstream.searchParams.set("q", q)
  upstream.searchParams.set("format", "json")
  upstream.searchParams.set("limit", "5")
  upstream.searchParams.set("addressdetails", "1")

  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        "User-Agent": "CTERA-Hub-AI/1.0 (deployment demo; contact: local)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocoding service returned ${res.status}` },
        { status: 502 },
      )
    }

    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>

    const results = data.map((row) => ({
      lat: Number.parseFloat(row.lat),
      lng: Number.parseFloat(row.lon),
      displayName: row.display_name,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 502 })
  }
}
