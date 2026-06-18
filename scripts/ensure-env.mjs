import { copyFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const envLocal = join(root, ".env.local")
const envExample = join(root, ".env.example")

if (!existsSync(envLocal) && existsSync(envExample)) {
  copyFileSync(envExample, envLocal)
  console.log("Created .env.local from .env.example (edit OPENAI_API_KEY for ARIA chat).")
}
