"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { X, Send, Minimize2, MessageCircle } from "lucide-react"

function getMessageText(parts: { type: string; text?: string }[]): string {
  if (!parts || !Array.isArray(parts)) return ""
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
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
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: "360px",
            height: "520px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: "#1e293b", borderBottom: "1px solid #334155" }}
          >
            <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-cyan-400/50 shrink-0">
              <Image
                src="/images/ai-avatar.jpeg"
                alt="ARIA AI Assistant"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">ARIA</p>
              <p className="text-xs text-cyan-400 leading-tight">AI Navigation Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "#ffffff" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-cyan-400/30">
                  <Image
                    src="/images/ai-avatar.jpeg"
                    alt="ARIA"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>Hi, I&apos;m ARIA</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                    Ask me anything about the CTERA AI Hub — features, settings, where to find things, and more.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
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
                      className="text-xs text-left px-3 py-2 rounded-lg transition-colors"
                      style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#1e293b" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(
                message.parts as { type: string; text?: string }[]
              )
              const isUser = message.role === "user"
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isUser && (
                    <div className="relative h-7 w-7 rounded-full overflow-hidden ring-1 ring-cyan-400/40 shrink-0 mt-0.5">
                      <Image
                        src="/images/ai-avatar.jpeg"
                        alt="ARIA"
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  )}
                  <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={isUser
                        ? { background: "#0891b2", color: "#ffffff" }
                        : { background: "#f1f5f9", color: "#1e293b", border: "1px solid #e2e8f0" }
                      }
                  >
                    {text}
                  </div>
                </div>
              )
            })}

            {error && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                role="alert"
              >
                <p className="font-medium">Something went wrong</p>
                <p className="mt-1 text-red-700">{error.message}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="relative h-7 w-7 rounded-full overflow-hidden ring-1 ring-cyan-400/40 shrink-0">
                  <Image
                    src="/images/ai-avatar.jpeg"
                    alt="ARIA"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-cyan-500 transition-all" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA anything..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#1e293b" }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-lg p-1.5 text-cyan-500 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl overflow-hidden ring-2 ring-cyan-400/60 hover:ring-cyan-400 transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI chat"
      >
        {isOpen ? (
          <div className="flex h-full w-full items-center justify-center bg-card">
            <X className="h-6 w-6 text-cyan-400" />
          </div>
        ) : (
          <div className="relative h-full w-full">
            <Image
              src="/images/ai-avatar.jpeg"
              alt="Open ARIA chat"
              fill
              className="object-cover object-top"
            />
            <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-cyan-400 border-2 border-card" />
          </div>
        )}
      </button>
    </>
  )
}
