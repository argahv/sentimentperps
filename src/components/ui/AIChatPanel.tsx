"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Sparkles, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "I'm your AI sentiment analyst. Ask me about any token's social sentiment, trending narratives, or market signals.",
  timestamp: new Date(),
};

const MAX_MESSAGES = 50;

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 px-4 py-2">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: "#1E2330", boxShadow: "var(--shadow-neu-sm)" }}
      >
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div
        className="flex items-center gap-1 rounded-lg px-4 py-3"
        style={{
          background: "#1E2330",
          boxShadow: "var(--shadow-neu-sm)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite 0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite 200ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite 400ms" }}
        />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div
          className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm text-white"
          style={{
            background: "#FF4757",
            boxShadow:
              "4px 4px 10px rgba(180,30,40,0.4), -3px -3px 8px rgba(255,120,130,0.15)",
            fontFamily: "IBM Plex Sans, system-ui, sans-serif",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 px-4 py-1">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: "#1E2330", boxShadow: "var(--shadow-neu-sm)" }}
      >
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div
        className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm"
        style={{
          background: "#1E2330",
          boxShadow: "var(--shadow-neu-sm)",
          border: "1px solid rgba(255,255,255,0.04)",
          color: "#E8ECF1",
          fontFamily: "IBM Plex Sans, system-ui, sans-serif",
          lineHeight: "1.6",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next.slice(-MAX_MESSAGES);
    });
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const reply =
        data?.message ||
        data?.response ||
        data?.content ||
        data?.text ||
        (typeof data === "string" ? data : null) ||
        (res.ok
          ? "Got it — but the response format was unexpected."
          : `Error: ${data?.error ?? "Something went wrong"}`);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        return next.slice(-MAX_MESSAGES);
      });
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Connection error — couldn't reach the sentiment engine. Try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes chat-panel-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-panel-open {
          animation: chat-panel-enter 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>

      {isOpen && (
        <div
          className="chat-panel-open fixed z-[9999] flex flex-col rounded-xl overflow-hidden"
          style={{
            bottom: "88px",
            right: "24px",
            width: "360px",
            height: "480px",
            background: "#181C26",
            boxShadow:
              "10px 10px 24px rgba(0,0,0,0.7), -6px -6px 16px rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between px-4 py-3"
            style={{
              background: "#1E2330",
              borderBottom: "1px solid #2A3040",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: "#FF4757",
                  boxShadow:
                    "0 0 12px 3px rgba(255,71,87,0.4), 4px 4px 8px rgba(180,30,40,0.4)",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{
                    fontFamily: "Space Grotesk, system-ui, sans-serif",
                    color: "#E8ECF1",
                  }}
                >
                  AI Sentiment Analyst
                </p>
                <p
                  className="text-[10px] leading-tight"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#6B7A8D",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Powered by Elfa AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="led-indicator led-green"
                  style={{ width: "6px", height: "6px" }}
                />
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#22C55E",
                  }}
                >
                  Live
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
                style={{
                  background: "#12151C",
                  boxShadow: "var(--shadow-neu-sm)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  color: "#6B7A8D",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#E8ECF1")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#6B7A8D")
                }
                aria-label="Close chat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-3"
            style={{ scrollbarWidth: "thin" }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>

          <div
            className="shrink-0 px-3 py-3"
            style={{
              background: "#1E2330",
              borderTop: "1px solid #2A3040",
            }}
          >
            <div
              className="flex items-end gap-2 rounded-lg px-3 py-2"
              style={{
                background: "#0D0F14",
                boxShadow: "var(--shadow-neu-inset)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about SOL sentiment, BTC narratives…"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent text-sm outline-none"
                style={{
                  fontFamily: "IBM Plex Sans, system-ui, sans-serif",
                  color: "#E8ECF1",
                  maxHeight: "96px",
                  lineHeight: "1.5",
                  caretColor: "#FF4757",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flat-btn-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p
              className="mt-1.5 text-center text-[10px]"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "#6B7A8D",
                letterSpacing: "0.04em",
              }}
            >
              Enter to send · Shift+Enter for newline · ESC to close
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
        className="fixed z-[9999] flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200"
        style={{
          bottom: "24px",
          right: "24px",
          background: isOpen ? "#1E2330" : "#FF4757",
          boxShadow: isOpen
            ? "var(--shadow-neu)"
            : "0 0 20px 4px rgba(255,71,87,0.45), 6px 6px 14px rgba(180,30,40,0.5), -4px -4px 10px rgba(255,120,130,0.15)",
          border: isOpen
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(255,255,255,0.15)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.filter = "brightness(1.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "";
        }}
      >
        {isOpen ? (
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Sparkles className="h-5 w-5 text-white" />
        )}
      </button>
    </>
  );
}
