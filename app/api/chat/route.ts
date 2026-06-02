import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai"
import type { ModelMessage, ToolModelMessage, UIMessage } from "ai"

const ARIA_SYSTEM = `You are ARIA (Adaptive Resource & Intelligence Assistant), an AI assistant embedded in the CTERA AI Hub dashboard. Your role is to help users navigate the system and find the right information quickly.

The CTERA AI Hub has the following pages and features:

1. **Dashboard** (/) - Main landing page with:
   - AI-Based Recommendations carousel (New Portal Dashboard, Upgrade Outdated Versions, MCP, Global File Locking)
   - My CTERA Space: Installed versions, license info, storage overview
   - Latest News carousel
   - Interactive feedback poll

2. **AI Recommendations Hub** (/insights) - AI-generated recommendations organized by priority:
   - High: Database Replication, Upgrade Outdated Edge Filers, Expand Storage Capacity
   - Medium: Renew License Early
   - Low: Enable Preview Server, Add CTERA Storage Class

3. **Deployment Overview** (/portal) - Global infrastructure:
   - World map of device locations
   - Latest versions by product type
   - Device cards with status badges
   - Filter by product, status, or search

4. **Feature Adoption** (/feature-adoption) - Configuration status in 4 tabs:
   - Infrastructure: Application Server, Database Server, Replication, Preview Server, Archiving, Backup
   - Services: Syslog, Edge Filer Syslog, KMS, Veeonis, SMTP, SMS, Backup, Sync, Audit
   - Tenant Settings: AD, ABP, SSO, Super Tenant Users, Skins, Config Templates, Button Generator, Email Templates, Teams Integration, Global File Lock, Office Online, Cloud Drive Policy, Zones
   - Global Settings: iFrame, Global AD, Admin SSO, Access Control, Firmware Repository, Skins, Roles Super User, Custom Log Alerts
   - PRD view at /feature-adoption/prd

5. **Download Center** (/downloads) - Software downloads:
   - CTERA Portal, Edge Filer, Drive (Windows/Mac), Drive Connect
   - Version history, release notes, feedback forms

6. **Peer Review** (/peer-review) - Industry benchmarking:
   - Healthcare sector stats, top product adoption, common features, deployment patterns

7. **Devices** (/devices) - Device inventory:
   - Tabs for All Devices, Portals, Edge Filers, Cloud Drives
   - Device cards with version info and status

When users ask about features, settings, or where to find something, always:
- Point them to the exact page and section
- Be concise and direct
- Use the page path in your response (e.g. "Go to /feature-adoption → Tenant Settings tab")
- If a feature is enabled or disabled, mention you can check the Feature Adoption page
- Keep responses short and actionable — 2-4 sentences max unless more detail is needed`

function flattenModelContent(content: ModelMessage["content"]): string {
  if (content == null) return ""
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return String(content)

  return content
    .map((part) => {
      if (typeof part !== "object" || part === null || !("type" in part)) return ""
      const p = part as { type: string; text?: string; result?: unknown }
      if (p.type === "text" && typeof p.text === "string") return p.text
      if ("result" in p && p.result !== undefined) {
        try {
          return typeof p.result === "string" ? p.result : JSON.stringify(p.result)
        } catch {
          return ""
        }
      }
      return ""
    })
    .join("")
}

function toOpenAIChatMessages(modelMessages: ModelMessage[]): unknown[] {
  const out: unknown[] = []
  for (const m of modelMessages) {
    if (m.role === "system") {
      out.push({ role: "system", content: flattenModelContent(m.content) })
      continue
    }
    if (m.role === "user") {
      out.push({ role: "user", content: flattenModelContent(m.content) })
      continue
    }
    if (m.role === "assistant") {
      out.push({ role: "assistant", content: flattenModelContent(m.content) })
      continue
    }
    if (m.role === "tool") {
      const tm = m as ToolModelMessage
      out.push({
        role: "tool",
        tool_call_id: tm.toolCallId,
        content: flattenModelContent(tm.content),
      })
    }
  }
  return out
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is not set. Copy .env.example to .env.local and add your OpenAI API key to enable ARIA.",
      },
      { status: 503 },
    )
  }

  let body: { messages?: UIMessage[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const incoming = body.messages
  if (!incoming || !Array.isArray(incoming)) {
    return Response.json({ error: "Missing messages array" }, { status: 400 })
  }

  let modelMessages: ModelMessage[]
  try {
    modelMessages = await convertToModelMessages(incoming)
  } catch (e) {
    console.error("[api/chat] convertToModelMessages", e)
    return Response.json({ error: "Invalid message format" }, { status: 400 })
  }

  const openaiMessages = [{ role: "system", content: ARIA_SYSTEM }, ...toOpenAIChatMessages(modelMessages)]

  const stream = createUIMessageStream({
    originalMessages: incoming,
    execute: async ({ writer }) => {
      const apiKey = process.env.OPENAI_API_KEY!.trim()
      let res: Response
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: true,
            messages: openaiMessages,
          }),
        })
      } catch (e) {
        console.error("[api/chat] fetch", e)
        writer.write({
          type: "error",
          errorText: "Could not reach OpenAI. Check your network connection.",
        })
        return
      }

      if (!res.ok) {
        const errText = await res.text()
        writer.write({
          type: "error",
          errorText: `OpenAI returned ${res.status}: ${errText.slice(0, 400)}`,
        })
        return
      }

      if (!res.body) {
        writer.write({
          type: "error",
          errorText: "Empty response body from OpenAI.",
        })
        return
      }

      writer.write({ type: "start" })
      writer.write({ type: "start-step" })
      const textId = "text-1"
      writer.write({ type: "text-start", id: textId })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          for (;;) {
            const nl = buffer.indexOf("\n")
            if (nl < 0) break

            const line = buffer.slice(0, nl).trim()
            buffer = buffer.slice(nl + 1)

            if (!line.startsWith("data:")) continue
            const data = line.slice(5).trim()
            if (data === "[DONE]") break outer

            try {
              const json = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string | null } }>
              }
              const piece = json.choices?.[0]?.delta?.content
              if (piece)
                writer.write({
                  type: "text-delta",
                  id: textId,
                  delta: piece,
                })
            } catch {
              /* ignore malformed SSE JSON */
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      writer.write({ type: "text-end", id: textId })
      writer.write({ type: "finish-step" })
      writer.write({ type: "finish", finishReason: "stop" })
    },
  })

  return createUIMessageStreamResponse({ stream })
}
