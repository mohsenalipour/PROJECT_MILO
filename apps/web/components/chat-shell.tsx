"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  MAX_TOTAL_ATTACHMENT_SIZE,
  chatHistorySchema,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/chat-schema";
import { readChatStream } from "@/lib/stream-protocol";

import { Composer } from "./composer";
import {
  ConversationSidebar,
  type ConversationSummary,
} from "./conversation-sidebar";
import { MessageList } from "./message-list";

const THEME_KEY = "milo-comm-theme";
const supportedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const suggestions = [
  "خودت را کوتاه معرفی کن",
  "برای امروز یک تمرین یادگیری پیشنهاد بده",
  "What can you help me with?",
];

type ApiError = { code: string; message: string };
type Theme = "dark" | "light";

const retryableCodes = new Set([
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
  "DATABASE_UNAVAILABLE",
]);

class StreamApiError extends Error {
  constructor(readonly apiError: ApiError) {
    super(apiError.message);
  }
}

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [error, setError] = useState<ApiError | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) throw new Error("History unavailable");
      const data = (await response.json()) as { conversations?: ConversationSummary[] };
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {
      setError({
        code: "DATABASE_UNAVAILABLE",
        message: "تاریخچه در دسترس نیست؛ PostgreSQL محلی را بررسی کنید.",
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const preferredTheme: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia?.("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = preferredTheme;
    queueMicrotask(() => {
      setTheme(preferredTheme);
      setHydrated(true);
      void refreshConversations();
    });
  }, [refreshConversations]);

  async function createConversation(title: string): Promise<string> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.slice(0, 60) || "گفت‌وگوی جدید" }),
    });
    if (!response.ok) throw new StreamApiError(readApiError(await response.json()));
    const data = (await response.json()) as { conversation: ConversationSummary };
    setActiveId(data.conversation.id);
    setConversations((current) => [data.conversation, ...current]);
    return data.conversation.id;
  }

  async function requestCompletion(nextMessages: ChatMessage[], conversationId: string) {
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
        body: JSON.stringify({
          conversationId,
          messages: nextMessages.slice(-20),
        }),
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;
      if (!response.ok) throw new StreamApiError(readApiError(await response.json()));
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
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer.trim(),
        };
        setMessages([...nextMessages, assistantMessage].slice(-20));
        setStreamingText("");
        await refreshConversations();
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

  async function send(content = draft) {
    const cleanContent =
      content.trim() || (attachments.length ? "این فایل را بررسی و توضیح بده." : "");
    if (!cleanContent || loading) return;
    setLoading(true);
    setError(null);
    try {
      const conversationId = activeId ?? (await createConversation(cleanContent));
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: cleanContent,
        ...(attachments.length ? { attachments } : {}),
      };
      const nextMessages = [...messages, userMessage].slice(-20);
      setMessages(nextMessages);
      setDraft("");
      setAttachments([]);
      setAttachmentError(null);
      await requestCompletion(nextMessages, conversationId);
    } catch (caught) {
      setLoading(false);
      setError(
        caught instanceof StreamApiError
          ? caught.apiError
          : {
              code: "DATABASE_UNAVAILABLE",
              message: "ساخت گفت‌وگو ممکن نشد؛ PostgreSQL محلی را بررسی کنید.",
            },
      );
    }
  }

  function retry() {
    if (loading || !activeId || messages.at(-1)?.role !== "user") return;
    void requestCompletion(messages, activeId);
  }

  function startNewConversation() {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setAttachments([]);
    setStreamingText("");
    setError(null);
    setLoading(false);
    setSidebarOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function selectConversation(id: string) {
    if (loading) return;
    setHistoryLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) throw new StreamApiError(readApiError(await response.json()));
      const data = (await response.json()) as { messages: unknown };
      const parsed = chatHistorySchema.safeParse(data.messages);
      if (!parsed.success) throw new Error("Invalid history");
      setActiveId(id);
      setMessages(parsed.data);
      setSidebarOpen(false);
    } catch (caught) {
      setError(
        caught instanceof StreamApiError
          ? caught.apiError
          : { code: "DATABASE_UNAVAILABLE", message: "خواندن تاریخچه ممکن نشد." },
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function removeConversation(id: string) {
    if (loading) return;
    try {
      const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        throw new StreamApiError(readApiError(await response.json()));
      }
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      if (activeId === id) startNewConversation();
    } catch (caught) {
      setError(
        caught instanceof StreamApiError
          ? caught.apiError
          : { code: "DATABASE_UNAVAILABLE", message: "حذف گفت‌وگو ممکن نشد." },
      );
    }
  }

  async function addFiles(files: File[]) {
    setAttachmentError(null);
    const nextFiles = files.slice(0, MAX_ATTACHMENTS - attachments.length);
    if (nextFiles.length !== files.length || attachments.length + files.length > MAX_ATTACHMENTS) {
      setAttachmentError(`حداکثر ${MAX_ATTACHMENTS} فایل قابل ارسال است.`);
      return;
    }
    if (nextFiles.some((file) => !supportedTypes.has(file.type))) {
      setAttachmentError("فقط تصویر، TXT، Markdown، CSV و JSON پشتیبانی می‌شود.");
      return;
    }
    if (nextFiles.some((file) => file.size > MAX_ATTACHMENT_SIZE)) {
      setAttachmentError("حجم هر فایل باید حداکثر ۴ مگابایت باشد.");
      return;
    }
    const totalSize =
      attachments.reduce((total, item) => total + item.size, 0) +
      nextFiles.reduce((total, file) => total + file.size, 0);
    if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
      setAttachmentError("حجم مجموع پیوست‌ها باید حداکثر ۸ مگابایت باشد.");
      return;
    }

    const encoded = await Promise.all(
      nextFiles.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await readFile(file),
      })),
    );
    setAttachments((current) => [...current, ...encoded]);
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <div className="workspace-shell">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        loading={historyLoading}
        onSelect={(id) => void selectConversation(id)}
        onDelete={(id) => void removeConversation(id)}
        onNew={startNewConversation}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="بستن تاریخچه"
        />
      ) : null}

      <section className="chat-shell" aria-label="گفت‌وگو با مایلو">
        <header className="chat-header">
          <div className="brand-block">
            <button
              className="history-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="نمایش تاریخچه"
            >
              ☰
            </button>
            <Image className="brand-logo" src="/milo-logo.png" alt="لوگوی مایلو" width={52} height={52} priority />
            <div>
              <p className="eyebrow">PROJECT_MILO / CHANNEL 01</p>
              <h1>MILO_COMM</h1>
              <p className="connection-state">
                <span className="status-light" aria-hidden="true" /> آنلاین · PostgreSQL · {messages.length}/۲۰
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
            <button className="secondary-button" type="button" onClick={startNewConversation}>
              گفت‌وگوی جدید
            </button>
          </div>
        </header>

        {messages.length === 0 && !loading ? (
          <div className="empty-state">
            <Image className="hero-logo" src="/milo-logo.png" alt="مایلو" width={112} height={112} priority />
            <p className="empty-kicker">HELLO, I&apos;M MILO</p>
            <h2>یک گفت‌وگوی تازه شروع کنیم</h2>
            <p>متن، تصویر یا فایل متنی بفرستید؛ پاسخ مایلو زنده و خوانا نمایش داده می‌شود.</p>
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={!hydrated || loading}>
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
              <strong>عملیات کامل نشد</strong>
              <p>{error.message}</p>
            </div>
            {retryableCodes.has(error.code) && activeId && messages.at(-1)?.role === "user" ? (
              <button type="button" onClick={retry} disabled={loading}>تلاش مجدد</button>
            ) : null}
          </div>
        ) : null}

        <Composer
          ref={inputRef}
          value={draft}
          attachments={attachments}
          attachmentError={attachmentError}
          disabled={loading || !hydrated}
          onChange={setDraft}
          onFiles={(files) => void addFiles(files)}
          onRemoveAttachment={(id) =>
            setAttachments((current) => current.filter((attachment) => attachment.id !== id))
          }
          onSubmit={() => void send()}
        />
      </section>
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
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
