"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import { X, Send, Minimize2, MessageCircle } from "lucide-react"

const BRAND_GRADIENT = "linear-gradient(135deg,#505be5,#2526a9)"
const HEADER_GRADIENT = "linear-gradient(120deg,#505be5,#102341)"

function getMessageText(parts: { type: string; text?: string }[]): string {
  if (!parts || !Array.isArray(parts)) return ""
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function AriaAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: BRAND_GRADIENT }}
      aria-hidden
    >
      A
    </div>
  )
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      console.error("[ARIA]", err)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    clearError?.()
    sendMessage({ text: trimmed })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          style={{ width: "360px", height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: HEADER_GRADIENT }}>
            <AriaAvatar size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">ARIA</p>
              <p className="flex items-center gap-1.5 text-xs leading-tight text-white/80">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
                AI Navigation Assistant · Online
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-popover px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <AriaAvatar size={64} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Hi, I&apos;m ARIA</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ask me anything about the CTERA AI Hub — features, settings, where to find things, and more.
                  </p>
                </div>
                <div className="mt-2 flex w-full flex-col gap-2">
                  {[
                    "Where can I see device statuses?",
                    "How do I enable Global File Lock?",
                    "Where are my AI recommendations?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        clearError?.()
                        sendMessage({ text: suggestion })
                      }}
                      className="rounded-lg border border-border bg-muted px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message.parts as { type: string; text?: string }[])
              const isUser = message.role === "user"
              return (
                <div key={message.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && (
                    <div className="mt-0.5">
                      <AriaAvatar size={28} />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isUser ? "rounded-tr-sm" : "rounded-tl-sm border border-border"
                    }`}
                    style={
                      isUser
                        ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                        : { background: "var(--muted)", color: "var(--foreground)" }
                    }
                  >
                    {text}
                  </div>
                </div>
              )
            })}

            {error && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                role="alert"
                style={{
                  background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                  color: "var(--destructive)",
                }}
              >
                <p className="font-medium">Something went wrong</p>
                <p className="mt-1 opacity-90">{error.message}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2">
                <AriaAvatar size={28} />
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-muted px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border bg-popover px-3 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 transition-all focus-within:ring-1 focus-within:ring-ring">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA anything..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-lg p-1.5 text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating launcher */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl ring-2 ring-white/25 transition-transform hover:scale-105 active:scale-95"
        style={{ background: BRAND_GRADIENT }}
        aria-label={isOpen ? "Close ARIA chat" : "Open ARIA chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span
              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: "var(--success)" }}
            />
          </>
        )}
      </button>
    </>
  )
}
