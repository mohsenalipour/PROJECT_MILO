"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { chatHistorySchema, type ChatMessage } from "@/lib/chat-schema";
import { readChatStream } from "@/lib/stream-protocol";

import { Composer } from "./composer";
import { MessageList } from "./message-list";

const HISTORY_KEY = "milo-comm-history-v1";
const THEME_KEY = "milo-comm-theme";
const suggestions = [
  "خودت را کوتاه معرفی کن",
  "برای امروز یک تمرین یادگیری پیشنهاد بده",
  "What can you help me with?",
];

type ApiError = { code: string; message: string };
type Theme = "dark" | "light";

const retryableCodes = new Set(["RATE_LIMITED", "PROVIDER_UNAVAILABLE", "INTERNAL_ERROR"]);

class StreamApiError extends Error {
  constructor(readonly apiError: ApiError) {
    super(apiError.message);
  }
}

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [error, setError] = useState<ApiError | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let storedMessages: ChatMessage[] = [];
    try {
      const stored = window.localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = chatHistorySchema.safeParse(JSON.parse(stored));
        if (parsed.success) storedMessages = parsed.data;
      }
    } catch {
      window.localStorage.removeItem(HISTORY_KEY);
    }

    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const preferredTheme: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia?.("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = preferredTheme;
    queueMicrotask(() => {
      setMessages(storedMessages);
      setTheme(preferredTheme);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-20)));
  }, [hydrated, messages]);

  async function requestCompletion(nextMessages: ChatMessage[]) {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setStreamingText("");
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;
      if (!response.ok) {
        const data: unknown = await response.json();
        throw new StreamApiError(readApiError(data));
      }
      if (!response.body) throw new Error("Missing response body");

      let answer = "";
      let completed = false;
      await readChatStream(response.body, (event) => {
        if (requestId !== requestIdRef.current) return;
        if (event.type === "delta") {
          answer += event.delta;
          setStreamingText(answer);
        } else if (event.type === "done") {
          completed = true;
        } else {
          throw new StreamApiError(event.error);
        }
      });

      if (!completed || !answer.trim()) throw new Error("Incomplete stream");
      if (requestId === requestIdRef.current) {
        const assistantMessage: ChatMessage = { role: "assistant", content: answer.trim() };
        setMessages([...nextMessages, assistantMessage].slice(-20));
        setStreamingText("");
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setStreamingText("");
        setError(
          caught instanceof StreamApiError
            ? caught.apiError
            : {
                code: "PROVIDER_UNAVAILABLE",
                message: "ارتباط با سرور کامل نشد؛ دوباره تلاش کنید.",
              },
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }

  function send(content = draft) {
    const cleanContent = content.trim();
    if (!cleanContent || loading) return;
    const userMessage: ChatMessage = { role: "user", content: cleanContent };
    const nextMessages = [...messages, userMessage].slice(-20);
    setMessages(nextMessages);
    setDraft("");
    void requestCompletion(nextMessages);
  }

  function retry() {
    if (loading || messages.at(-1)?.role !== "user") return;
    void requestCompletion(messages);
  }

  function startNewConversation() {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    window.localStorage.removeItem(HISTORY_KEY);
    setMessages([]);
    setDraft("");
    setStreamingText("");
    setError(null);
    setLoading(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <section className="chat-shell" aria-label="گفت‌وگو با مایلو">
      <header className="chat-header">
        <div className="brand-block">
          <Image className="brand-logo" src="/milo-logo.png" alt="لوگوی مایلو" width={52} height={52} priority />
          <div>
            <p className="eyebrow">PROJECT_MILO / CHANNEL 01</p>
            <h1>MILO_COMM</h1>
            <p className="connection-state">
              <span className="status-light" aria-hidden="true" /> آنلاین · تاریخچه {messages.length}/۲۰
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            disabled={!hydrated}
            aria-label={theme === "dark" ? "فعال‌کردن تم روشن" : "فعال‌کردن تم تیره"}
            title={theme === "dark" ? "تم روشن" : "تم تیره"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={startNewConversation}
            disabled={!hydrated}
          >
            گفت‌وگوی جدید
          </button>
        </div>
      </header>

      {messages.length === 0 && !loading ? (
        <div className="empty-state">
          <Image className="hero-logo" src="/milo-logo.png" alt="مایلو" width={112} height={112} priority />
          <p className="empty-kicker">HELLO, I&apos;M MILO</p>
          <h2>یک گفت‌وگوی تازه شروع کنیم</h2>
          <p>پاسخ‌ها زنده و کلمه‌به‌کلمه از کانال امن مایلو می‌رسند.</p>
          <div className="suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                disabled={!hydrated || loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList messages={messages} loading={loading} streamingText={streamingText} />
      )}

      {error ? (
        <div className="error-banner" role="alert">
          <div>
            <strong>ارسال کامل نشد</strong>
            <p>{error.message}</p>
          </div>
          {retryableCodes.has(error.code) ? (
            <button type="button" onClick={retry} disabled={loading}>
              تلاش مجدد
            </button>
          ) : null}
        </div>
      ) : null}

      <Composer
        ref={inputRef}
        value={draft}
        disabled={loading || !hydrated}
        onChange={setDraft}
        onSubmit={() => send()}
      />
    </section>
  );
}

function readApiError(data: unknown): ApiError {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "object" &&
    data.error !== null &&
    "code" in data.error &&
    "message" in data.error &&
    typeof data.error.code === "string" &&
    typeof data.error.message === "string"
  ) {
    return { code: data.error.code, message: data.error.message };
  }
  return { code: "INTERNAL_ERROR", message: "درخواست کامل نشد؛ دوباره تلاش کنید." };
}
